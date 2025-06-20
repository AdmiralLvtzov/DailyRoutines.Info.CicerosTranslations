---
title: 模块 IPC 一览
tags: [开发, IPC]
---

# 自动精选 / AutoAetherialReduction

## IsBusy

检查当前模块是否正忙

- 名称: `DailyRoutines.Modules.AutoAetherialReduction.IsBusy`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否 / 模块未启用

## StartReduction

开始精选

- 名称: `DailyRoutines.Modules.AutoAetherialReduction.StartReduction`
- 返回值 `bool`
    - `true`: 发送开始精选请求成功
    - `false`: 模块未启用

# 快捷军票交换所交换物品 / FastGrandCompanyExchange

## IsBusy

检查当前模块是否正忙

- 名称: `DailyRoutines.Modules.FastGrandCompanyExchange.IsBusy`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否 / 模块未启用

# 自动修理 / AutoRepair

## IsBusy

检查当前模块是否正忙

- 名称: `DailyRoutines.Modules.AutoRepair.IsBusy`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否 / 模块未启用

## IsNeedToRepair

是否有装备需要修理

- 名称: `DailyRoutines.Modules.AutoRepair.IsNeedToRepair`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否 / 模块未启用

  ## IsAbleToRepair

当前人物状态是否可修理

- 名称: `DailyRoutines.Modules.AutoRepair.IsAbleToRepair`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否 / 模块未启用

## EnqueueRepair

发送自动修理请求

- 名称: `DailyRoutines.Modules.AutoRepair.EnqueueRepair`
- 返回值 `object` (`void`)

# 自动移速倍增器 / AutoSpeedMultiplier

## ChangeMultiplier

调整移速倍率

- 名称: `DailyRoutines.Modules.AutoSpeedMultiplier.ChangeMultiplier`
- 参数
  - `float`: 移速倍率, 有效值为 0 至 10 之间
- 返回值 `object` (`void`)

# 自动面向摄像机方向 / AutoFaceCameraDirection

## SetWorkMode

设置工作模式

- 名称: `DailyRoutines.Modules.AutoFaceCameraDirection.SetWorkMode`
- 参数
  - `bool`: 设置工作模式
    - `true`: 仅在按住打断热键时, 令游戏人物面向与摄像机保持一致
    - `false`: 按住打断热键时, 不再令游戏人物面向与摄像机保持一致
- 返回值 `object` (`void`)

## CancelLockOn

取消面向锁定

- 名称: `DailyRoutines.Modules.AutoFaceCameraDirection.CancelLockOn`
- 返回值 `object` (`void`)

## LockOnGround

按照固定场地朝向锁定面向

- 名称: `DailyRoutines.Modules.AutoFaceCameraDirection.LockOnGround`
- 参数
  - `string`: 场地朝向
    - `south`: 正南
    - `north`: 正北
    - `west`: 正西
    - `east`: 正东
    - `northeast`: 东北
    - `southeast`: 东南
    - `northwest`: 西北
    - `southwest`: 西南
- 返回值 `bool`
  - `true`: 设定成功
  - `false`: 未找到对应的场地朝向

## LockOnChara

按照玩家面向锁定朝向

- 名称: `DailyRoutines.Modules.AutoFaceCameraDirection.LockOnChara`
- 参数
  - `float`: 玩家面向 (`Rotation` 属性)
- 返回值 `object` (`void`)

## LockOnCamera

按照摄像机面向锁定朝向

- 名称: `DailyRoutines.Modules.AutoFaceCameraDirection.LockOnCamera`
- 参数
  - `float`: 摄像机面向 (`Rotation` 属性)
- 返回值 `object` (`void`)

# 自动移速倍增器 / AutoSpeedMultiplier

## ChangeMultiplier

发送自动修理请求

- 名称: `DailyRoutines.Modules.AutoSpeedMultiplier.ChangeMultiplier`
- 参数
  - `float`: 移速倍率, 有效值为 0 至 10 之间
- 返回值 `object` (`void`)

# 自动防击退 / AutoAntiKnockback

## ReplayKnockback

重放上一次遇到的击退

- 名称: `DailyRoutines.Modules.AutoAntiKnockback.ReplayKnockback`
- 返回值 `object` (`void`)

## ChangeMethod

调整强制位移应对处理逻辑

- 名称: `DailyRoutines.Modules.AutoAntiKnockback.ChangeMethod`
- 参数
  - `int`: 处理逻辑
    - `0`: 无, 不处理
    - `1`: 快速就位
    - `2`: 即刻就位
    - `3`: 不位移
    - `4`: 调整距离
- 返回值 `bool`
  - `true`: 设定成功
  - `false`: 未找到对应的场地朝向

## AdjustDistanceMultiplier

调整应对逻辑 `调整距离` 中的距离调整系数

- 名称: `DailyRoutines.Modules.AutoAntiKnockback.AdjustDistanceMultiplier`
- 参数
  - `float`: 距离调整系数
- 返回值 `object` (`void`)

# 自动刷新市场搜索结果 / AutoRefreshMarketSearchResult

## IsMarketStuck

当前市场是否无法正常返回搜索结果 (正在重新请求)

- 名称: `DailyRoutines.Modules.AutoRefreshMarketSearchResult.IsMarketStuck`
- 返回值 `bool`
  - `true`: 是
  - `false`: 否