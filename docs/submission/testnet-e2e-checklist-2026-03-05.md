# Testnet E2E Checklist (2026-03-05)

Estado: `PARCIAL` (deploy+verify listos, catálogo Shop pendiente por permisos owner)

## Verificaciones ejecutadas

- Contratos:
  - `pnpm --filter hardhat test` -> OK (13 passing)
- Frontend:
  - `pnpm --filter web build` -> OK
- Deployments:
  - Existe `apps/contracts/deployments/celo-sepolia.json` con Badges + Scoreboard + Shop + USDC
- Env (sin imprimir secretos):
  - `apps/contracts/.env`: faltan/placeholder varios campos de Shop y parámetros nuevos
  - `apps/web/.env`: faltan `NEXT_PUBLIC_SHOP_ADDRESS` y `NEXT_PUBLIC_USDC_ADDRESS`
- Verificación explorer:
  - Badges impl: verificado
  - Scoreboard impl: verificado
  - Shop: verificado

## Resultado de readiness

- `Badges + Scoreboard`: listos para pruebas en Celo Sepolia
- `Shop`: no listo para E2E hasta desplegar/configurar y propagar direcciones al web env

## Pasos para cerrar el checklist (sin exponer secretos)

1. Completar variables faltantes en `apps/contracts/.env`
   - `CELOSCAN_API_KEY`
   - `USDC_ADDRESS` (token real en la red objetivo)
   - `SHOP_OWNER`
   - `SHOP_TREASURY`
   - `MAX_QUANTITY_PER_TX` (ej. `10`)
   - `INITIAL_MAX_LEVEL_ID` (ej. `10`)
   - `BADGES_BASE_URI` (ej. `ipfs://chesscito/badges`)

2. (Completado) Shop desplegado en Celo Sepolia
   - `shopAddress=0xd913D2D01871ceB1204A26F99FB414484f903Eba`
   - `usdcAddress=0x01C5C0122039549AD1493B8220cABEdD739BC44E`

3. Configurar catálogo de items en Shop (pendiente)
   - Editar `apps/contracts/scripts/configure-shop.ts` (`ITEMS[]`)
   - Ejecutar:
   - `SHOP_ADDRESS=0x... pnpm --filter hardhat configure:shop:celo-sepolia`
   - Nota: hoy revierte por `onlyOwner` (el owner on-chain difiere del deployer actual)

4. (Completado) Verificar contratos en explorer
   - Opción completa:
   - `BADGES_PROXY=0x... SCOREBOARD_PROXY=0x... SHOP_ADDRESS=0x... USDC_ADDRESS=0x... TREASURY_ADDRESS=0x... pnpm --filter hardhat verify:celo-sepolia`
   - Opción solo proxies (legacy):
   - `pnpm --filter hardhat verify:proxies:celo-sepolia`

5. Actualizar env del frontend (no imprimir secretos)
   - En `apps/web/.env`:
   - `NEXT_PUBLIC_CHAIN_ID=11142220`
   - `NEXT_PUBLIC_BADGES_ADDRESS=0x...`
   - `NEXT_PUBLIC_SCOREBOARD_ADDRESS=0x...`
   - `NEXT_PUBLIC_SHOP_ADDRESS=0x...`
   - `NEXT_PUBLIC_USDC_ADDRESS=0x...`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...`
   - `SIGNER_PRIVATE_KEY=...` (solo server/runtime seguro)

6. Validación final local
   - `pnpm --filter web build`
   - `pnpm --filter hardhat test`

7. Validación real en MiniPay (device)
   - Abrir `/result` y `/tx-lab` en MiniPay
   - Ejecutar:
     - `claimBadgeSigned` (ok)
     - `submitScoreSigned` (ok)
     - compra en `play-hub` (ok)
   - Confirmar tx hashes en CeloScan Sepolia

## Criterio de salida

Checklist se considera `COMPLETO` cuando:
- `Shop` desplegado y configurado en Sepolia
- Variables web de Shop/USDC establecidas
- Verificación en explorer sin errores críticos
- Flujo real MiniPay exitoso para claim, submit y compra
