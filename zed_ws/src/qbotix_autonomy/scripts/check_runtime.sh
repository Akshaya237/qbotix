#!/usr/bin/env bash
set -u
source /opt/ros/jazzy/setup.bash
if [[ -f "$HOME/zed_ws/install/setup.bash" ]]; then source "$HOME/zed_ws/install/setup.bash"; fi
printf '\n=== Nodes ===\n'
ros2 node list || true
printf '\n=== Required topics ===\n'
ros2 topic list | grep -E '^(/tf|/tf_static|/robot_description|/zed/zed_node/odom|/qbotix/odom|/rtabmap/map|/cmd_vel|/cmd_vel_nav)$' || true
printf '\n=== Required frame checks (run each separately if it waits) ===\n'
echo 'ros2 run tf2_ros tf2_echo map odom'
echo 'ros2 run tf2_ros tf2_echo odom base_link'
echo 'ros2 run tf2_ros tf2_echo base_link zed_camera_link'
printf '\n=== Navigation commands ===\n'
echo 'ros2 topic info /cmd_vel'
echo 'ros2 lifecycle nodes'
echo 'Do NOT enable motors until geometry, TF, map, costmaps and motor mapping are verified.'
