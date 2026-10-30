# TF / Nav2 integration note

The authoritative instructions for this bundle are in `AUTONOMOUS_NAVIGATION_README.md` and `TF_TREE_AND_SAFETY_CHECKLIST.md`.

The intended TF tree is:

```text
map -> odom -> base_link -> zed_camera_mount_link -> zed_camera_link
                         -> base_footprint and wheel/component links
```

`qbotix_odom_relay` exclusively publishes `odom -> base_link` from ZED camera odometry plus the calibrated camera mounting extrinsic. `robot_state_publisher` exclusively publishes the robot's fixed transforms. RTAB-Map exclusively publishes `map -> odom`. The integrated launch disables ZED TF broadcasting to avoid a second parent for `zed_camera_link`.

Nav2 is gated off by default. Do not set `geometry_confirmed:=true` until physical measurements are recorded and applied to both URDF and relay configuration. Do not set `map_db_confirmed:=true` until the selected existing RTAB-Map database is verified.
