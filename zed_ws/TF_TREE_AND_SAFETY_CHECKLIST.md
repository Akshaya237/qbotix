# TF tree and commissioning checklist

## Required frame ownership

| Transform | Sole publisher | Source |
|---|---|---|
| `map -> odom` | RTAB-Map | localization/mapping output |
| `odom -> base_link` | `qbotix_odom_relay` | converted ZED odometry + calibrated camera extrinsic |
| `base_link -> base_footprint`, wheel/component/camera mount links | `robot_state_publisher` | QBotix URDF/Xacro |
| `zed_camera_link -> ZED optical/sensor frames` | ZED wrapper camera URDF publisher | ZED camera description |

ZED's own `publish_tf` and `publish_map_tf` are both false in the integrated launch. Do not add a static `odom -> base_link` transform. Do not use both the ZED `odom -> zed_camera_link` broadcaster and the relay's `odom -> base_link` unless the ZED camera frame is no longer parented by the robot URDF; this bundle uses the relay design.

## Before Nav2

- [ ] Physically measure robot footprint, wheel dimensions/positions, and camera mounting translation/rotation.
- [ ] Apply the same camera extrinsic to URDF and `qbotix_odom_relay/config/relay.yaml`.
- [ ] Confirm `odom -> base_link` changes as the camera/robot moves and does not jump when stationary.
- [ ] Confirm only one parent per TF frame; inspect `view_frames` PDF.
- [ ] Confirm RTAB-Map opens the intended existing database in localization mode and publishes `/rtabmap/map` and `map -> odom`.
- [ ] Confirm Nav2 lifecycle nodes active and local/global costmaps valid.
- [ ] Verify `/cmd_vel` has exactly the intended base-controller subscriber before enabling motor power.
- [ ] Test E-stop, serial watchdog, wheel direction, and zero-command stop with wheels lifted.

## Safety gates

The launch arguments `geometry_confirmed` and `map_db_confirmed` default to `false`. Nav2 starts only when both are explicitly set `true`. This gate is a deliberate operator checkpoint, not a sensor-based safety certification.
