#!/usr/bin/env bash
set -euo pipefail
source /opt/ros/jazzy/setup.bash
source "$HOME/zed_ws/install/setup.bash"
echo '1) Topics:'
ros2 topic list | grep -E '^(/tf|/tf_static|/qbotix/odom|/rtabmap/map|/zed/zed_node/odom)$' || true
echo
echo '2) Expected transforms (Ctrl+C each after it starts printing):'
echo 'ros2 run tf2_ros tf2_echo map odom'
echo 'ros2 run tf2_ros tf2_echo odom base_link'
echo 'ros2 run tf2_ros tf2_echo base_link zed_camera_link'
echo
echo '3) Odometry frames:'
echo 'ros2 topic echo /zed/zed_node/odom --once  # odom -> zed_camera_link message'
echo 'ros2 topic echo /qbotix/odom --once         # odom -> base_link message'
echo
echo '4) RTAB-Map map and Nav2 command topics:'
echo 'ros2 topic info /rtabmap/map'
echo 'ros2 topic info /cmd_vel'
echo 'ros2 lifecycle nodes'
echo
echo 'Do not enable motor power unless geometry and base-controller mapping are verified.'
