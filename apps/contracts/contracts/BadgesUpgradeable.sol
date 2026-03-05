// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract BadgesUpgradeable is
    Initializable,
    ERC1155Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    EIP712Upgradeable
{
    error BadgeAlreadyClaimed(address player, uint256 levelId);
    error InvalidSignature();
    error SignatureExpired(uint256 deadline);
    error NonceUsed(address player, uint256 nonce);
    error InvalidSigner();
    error InvalidBaseURI();

    event BadgeClaimed(address indexed player, uint256 indexed levelId, uint256 indexed tokenId);
    event BaseURIUpdated(string baseURI);
    event SignerUpdated(address indexed signer);

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("BadgeClaim(address player,uint256 levelId,uint256 nonce,uint256 deadline)");

    mapping(address => mapping(uint256 => bool)) public hasClaimedBadge;
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    string private baseMetadataURI;
    address public signer;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory initialBaseURI,
        address initialSigner,
        address initialOwner
    ) public initializer {
        if (initialSigner == address(0)) revert InvalidSigner();

        __ERC1155_init("");
        __Ownable_init(initialOwner);
        __Pausable_init();
        __EIP712_init("Badges", "1");

        baseMetadataURI = _normalizeBaseURI(initialBaseURI);
        signer = initialSigner;

        emit BaseURIUpdated(baseMetadataURI);
        emit SignerUpdated(initialSigner);
    }

    function claimBadgeSigned(
        uint256 levelId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused {
        if (block.timestamp > deadline) revert SignatureExpired(deadline);
        if (usedNonces[msg.sender][nonce]) revert NonceUsed(msg.sender, nonce);
        if (hasClaimedBadge[msg.sender][levelId]) revert BadgeAlreadyClaimed(msg.sender, levelId);

        _verifyClaimSignature(msg.sender, levelId, nonce, deadline, signature);

        usedNonces[msg.sender][nonce] = true;

        uint256 tokenId = tokenIdForLevel(levelId);
        hasClaimedBadge[msg.sender][levelId] = true;

        _mint(msg.sender, tokenId, 1, "");
        emit BadgeClaimed(msg.sender, levelId, tokenId);
    }

    function tokenIdForLevel(uint256 levelId) public pure returns (uint256) {
        return levelId;
    }

    function setSigner(address nextSigner) external onlyOwner {
        if (nextSigner == address(0)) revert InvalidSigner();
        signer = nextSigner;
        emit SignerUpdated(nextSigner);
    }

    function setBaseURI(string memory nextBaseURI) external onlyOwner {
        baseMetadataURI = _normalizeBaseURI(nextBaseURI);
        emit BaseURIUpdated(baseMetadataURI);
    }

    function baseURI() external view returns (string memory) {
        return baseMetadataURI;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string.concat(baseMetadataURI, Strings.toString(tokenId), ".json");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _verifyClaimSignature(
        address player,
        uint256 levelId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) internal view {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(CLAIM_TYPEHASH, player, levelId, nonce, deadline))
        );
        address recovered = ECDSA.recover(digest, signature);
        if (recovered != signer) revert InvalidSignature();
    }

    function _normalizeBaseURI(string memory input) internal pure returns (string memory) {
        bytes memory b = bytes(input);
        if (b.length == 0) revert InvalidBaseURI();
        if (b.length == 1 && b[0] == bytes1("/")) revert InvalidBaseURI();
        if (b[b.length - 1] == bytes1("/")) return input;
        return string.concat(input, "/");
    }

    uint256[50] private __gap;
}
