# QBotix Autonomous Navigation Bundle — ROS 2 Jazzy + ZED 2i + RTAB-Map + Nav2

This bundle is an overlay for the existing `~/zed_ws` workspace. It includes the robot URDF, a camera-odometry-to-base relay, RTAB-Map integration, Nav2 parameters, safety-gated launch files, and validation instructions. It does **not** claim the robot is ready to drive immediately: physical dimensions and the ESP8266/motor mapping have not been confirmed.

## Intended single-parent TF tree

```text
map                                  RTAB-Map localization publishes map -> odom
└── odom                             camera_odom_relay publishes odom -> base_link
    └── base_link                    robot_state_publisher owns fixed robot geometry
        ├── base_footprint
        ├── front_left_wheel_link
        ├── front_right_wheel_link
        ├── rear_left_wheel_link
        ├── rear_right_wheel_link
        ├── jetson_link / motor_driver_link / battery_link
        └── zed_camera_mount_link
            └── zed_camera_link     ZED's camera URDF adds camera optical/sensor frames
```

TF ownership is deliberately exclusive:
- ZED wrapper: `publish_tf:=false`, `publish_map_tf:=false` (it still publishes odometry messages and sensor data).
- `qbotix_odom_relay`: consumes `/zed/zed_node/odom`, converts camera-origin pose into base-origin pose using the configured camera extrinsic, publishes `/qbotix/odom` and `odom -> base_link`.
- `robot_state_publisher`: publishes `base_link -> robot links -> zed_camera_link` fixed transforms.
- RTAB-Map: sole publisher of `map -> odom`.
- Nav2: consumes `map`, `odom`, `base_link`, `/qbotix/odom`, and ZED point cloud.

Do not run a separate ZED launch, another robot description, or another map-to-odom publisher alongside the integrated launch.

## Safety status / measurements

The geometry in the URDF is still provisional. The current example values (`chassis_length=0.64 m`, `chassis_width=0.40 m`, wheel radius `0.05 m`, camera mount z `0.255 m`) are not confirmed physical measurements. They are included to make the model inspectable and the TF math testable only.

Before physical navigation:
1. Measure chassis length/width, wheel radius/positions, footprint, and the exact `base_link -> zed_camera_link` translation and rotation.
2. Update `src/bot_description/urdf/qbotix_rover.urdf.xacro` and `src/qbotix_odom_relay/config/relay.yaml` with the **same** camera extrinsic.
3. Verify the correct existing RTAB-Map database path and inspect that it contains the map you intend to localize against.
4. Verify that the base controller's kinematics match the actual four-wheel layout and motor wiring. The known ESP8266 serial protocol (`left,right` signed PWM and watchdog) alone does not establish a correct mecanum controller. No motor bridge is auto-started by this bundle.
5. Only then set the two safety flags shown below. Test with wheels lifted or motor power disconnected first.

The launch files default both gates to false, so Nav2 does not start by default.

## 1. Install into your existing workspace

Extract this archive so that its `zed_ws/` directory is available. Copy/merge the bundle's `zed_ws/src` packages into the actual `~/zed_ws/src` directory; do not replace or delete your existing workspace or maps. For example, if you extracted to `~/Downloads/qbotix_autonomy_bundle`:

```bash
cp -an ~/Downloads/qbotix_autonomy_bundle/zed_ws/src/. ~/zed_ws/src/
```

Review overwritten files manually if you choose a different copy method. The bundle includes a snapshot of the ZED wrapper and ORB-SLAM3 package, but your installed ZED SDK and ROS dependencies remain machine-specific.

## 2. Install dependencies and build

```bash
source /opt/ros/jazzy/setup.bash
cd ~/zed_ws
rosdep install --from-paths src --ignore-src -r -y
colcon build --symlink-install --packages-up-to qbotix_odom_relay bot_description zed_rtabmap_mapping qbotix_autonomy
source install/setup.bash
```

If `rosdep` reports a missing vendor ZED SDK dependency, install/use the SDK version already working on your machine; do not replace a working SDK blindly.

## 3. Choose and verify the existing RTAB-Map database

Two existing paths were found previously, but neither has been selected as the authoritative map in the project history:
- `/home/akshaya-b/.ros/rtabmap.db`
- `/home/akshaya-b/maps/rtabmap.db`

Inspect both before choosing. Do not delete either file. Use `database_path:=/absolute/path/to/the/verified/map.db` in the launch command. The integrated launch defaults to localization mode (`localization:=true`) to reuse an existing map rather than silently starting a new mapping session.

## 4. Start the integrated stack (Nav2 safely gated)

First launch with gates left at their default `false` values. This starts ZED, robot description, odometry relay, RTAB-Map localization, and RViz, but **does not start Nav2**:

```bash
source /opt/ros/jazzy/setup.bash
source ~/zed_ws/install/setup.bash
ros2 launch qbotix_autonomy online_slam_navigation.launch.py \
  database_path:=/absolute/path/to/verified/map.db \
  localization:=true \
  geometry_confirmed:=false \
  map_db_confirmed:=false
```

Once measurements are entered, the DB is verified, and all checks below pass, start the integrated launch with:

```bash
ros2 launch qbotix_autonomy online_slam_navigation.launch.py \
  database_path:=/absolute/path/to/verified/map.db \
  localization:=true \
  geometry_confirmed:=true \
  map_db_confirmed:=true
```

**Only use `geometry_confirmed:=true` after physical measurement and after updating both the URDF and relay YAML.** Only use `map_db_confirmed:=true` after opening/verifying the database. These are explicit operator confirmations, not automatic measurements.

For an intentional mapping session (not localization), use `localization:=false` and set `database_path` to a new file name. This does not delete old databases.

## 5. Validation checklist

In separate terminals, after integrated launch:

```bash
ros2 topic echo /zed/zed_node/odom --once
ros2 topic echo /qbotix/odom --once
ros2 run tf2_ros tf2_echo map odom
ros2 run tf2_ros tf2_echo odom base_link
ros2 run tf2_ros tf2_echo base_link zed_camera_link
ros2 topic info /rtabmap/map
ros2 topic info /zed/zed_node/point_cloud/cloud_registered
ros2 topic info /cmd_vel
ros2 run tf2_tools view_frames
```

Expected frame IDs:
- `/zed/zed_node/odom`: `header.frame_id=odom`, `child_frame_id=zed_camera_link`.
- `/qbotix/odom`: `header.frame_id=odom`, `child_frame_id=base_link`.
- The only complete chain is `map -> odom -> base_link -> ... -> zed_camera_link`.

Open the generated frame PDF using its actual filename, e.g. `xdg-open frames_*.pdf` (if shell expansion matches multiple files, select the newest one). There must be no duplicate parents for any frame.

## 6. Nav2 / RViz

Nav2 is configured for `base_link`, `odom`, RTAB-Map's `/rtabmap/map`, ZED point cloud obstacles, and velocity smoothing `/cmd_vel_nav -> /cmd_vel`. In RViz, set Fixed Frame to `map`; use the 2D Pose Estimate / initial-pose tool if localization requires an initial guess, then use **2D Goal Pose** after Nav2 lifecycle nodes and both costmaps are active.

The package does not automatically actuate the motors. Before physical motion, integrate and test a controller that subscribes to `/cmd_vel`, maps `Twist` to the verified motor arrangement, has a watchdog/E-stop, and stops on serial loss. Do not assume a two-channel `left,right` serial protocol supports mecanum lateral motion.

## Rollback

This is a source overlay. Existing maps/databases are not removed. To revert, restore the original source files from your backup/version control; do not delete map DBs as a troubleshooting step.
