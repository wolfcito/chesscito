// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ScoreboardUpgradeable is Initializable, OwnableUpgradeable, PausableUpgradeable, EIP712Upgradeable {
    error CooldownActive(uint256 nextAllowedAt);
    error DailyLimitReached(uint256 nextWindowStart, uint256 maxSubmissionsPerDay);
    error InvalidConfiguration();
    error InvalidSignature();
    error SignatureExpired(uint256 deadline);
    error NonceUsed(address player, uint256 nonce);
    error InvalidSigner();

    event ScoreSubmitted(address indexed player, uint256 indexed levelId, uint256 score, uint256 timeMs, uint256 nonce);
    event SubmitCooldownUpdated(uint256 submitCooldown);
    event MaxSubmissionsPerDayUpdated(uint256 maxSubmissionsPerDay);
    event SignerUpdated(address indexed signer);

    bytes32 private constant SUBMIT_TYPEHASH =
        keccak256("ScoreSubmission(address player,uint256 levelId,uint256 score,uint256 timeMs,uint256 nonce,uint256 deadline)");

    struct DailyWindow { uint64 windowStart; uint32 count; }

    uint256 public submitCooldown;
    uint256 public maxSubmissionsPerDay;
    address public signer;

    mapping(address => uint256) public lastSubmissionAt;
    mapping(address => DailyWindow) private dailyWindows;
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        uint256 initialSubmitCooldown,
        uint256 initialMaxSubmissionsPerDay,
        address initialSigner,
        address initialOwner
    ) public initializer {
        if (initialSigner == address(0)) revert InvalidSigner();
        if (initialMaxSubmissionsPerDay == 0) revert InvalidConfiguration();
        if (initialMaxSubmissionsPerDay > type(uint32).max) revert InvalidConfiguration();

        __Ownable_init(initialOwner);
        __Pausable_init();
        __EIP712_init("Scoreboard", "1");

        submitCooldown = initialSubmitCooldown;
        maxSubmissionsPerDay = initialMaxSubmissionsPerDay;
        signer = initialSigner;

        emit SignerUpdated(initialSigner);
        emit SubmitCooldownUpdated(initialSubmitCooldown);
        emit MaxSubmissionsPerDayUpdated(initialMaxSubmissionsPerDay);
    }

    function submitScoreSigned(
        uint256 levelId,
        uint256 score,
        uint256 timeMs,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        if (block.timestamp > deadline) revert SignatureExpired(deadline);
        if (usedNonces[msg.sender][nonce]) revert NonceUsed(msg.sender, nonce);

        _verifySubmitSignature(msg.sender, levelId, score, timeMs, nonce, deadline, signature);

        usedNonces[msg.sender][nonce] = true;

        uint256 currentTimestamp = block.timestamp;
        uint256 nextAllowedAt = lastSubmissionAt[msg.sender] + submitCooldown;

        if (submitCooldown > 0 && currentTimestamp < nextAllowedAt) revert CooldownActive(nextAllowedAt);

        _consumeDailySubmission(msg.sender, currentTimestamp);
        lastSubmissionAt[msg.sender] = currentTimestamp;

        emit ScoreSubmitted(msg.sender, levelId, score, timeMs, nonce);
    }

    function setSigner(address nextSigner) external onlyOwner {
        if (nextSigner == address(0)) revert InvalidSigner();
        signer = nextSigner;
        emit SignerUpdated(nextSigner);
    }

    function setSubmitCooldown(uint256 nextSubmitCooldown) external onlyOwner {
        submitCooldown = nextSubmitCooldown;
        emit SubmitCooldownUpdated(nextSubmitCooldown);
    }

    function setMaxSubmissionsPerDay(uint256 nextMaxSubmissionsPerDay) external onlyOwner {
        if (nextMaxSubmissionsPerDay == 0) revert InvalidConfiguration();
        if (nextMaxSubmissionsPerDay > type(uint32).max) revert InvalidConfiguration();
        maxSubmissionsPerDay = nextMaxSubmissionsPerDay;
        emit MaxSubmissionsPerDayUpdated(nextMaxSubmissionsPerDay);
    }

    function getDailyWindow(address player) external view returns (uint256 windowStart, uint256 count) {
        DailyWindow memory window = dailyWindows[player];
        return (window.windowStart, window.count);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _verifySubmitSignature(
        address player,
        uint256 levelId,
        uint256 score,
        uint256 timeMs,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal view {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(SUBMIT_TYPEHASH, player, levelId, score, timeMs, nonce, deadline))
        );
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != signer) revert InvalidSignature();
    }

    function _consumeDailySubmission(address player, uint256 currentTimestamp) internal {
        uint64 currentWindowStart = uint64((currentTimestamp / 1 days) * 1 days);
        DailyWindow memory window = dailyWindows[player];

        if (window.windowStart != currentWindowStart) { window.windowStart = currentWindowStart; window.count = 0; }
        if (window.count >= maxSubmissionsPerDay) revert DailyLimitReached(currentWindowStart + 1 days, maxSubmissionsPerDay);

        window.count += 1;
        dailyWindows[player] = window;
    }

    uint256[50] private __gap;
}
