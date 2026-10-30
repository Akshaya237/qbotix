"""Integrated ZED 2i + robot description + camera odometry relay + RTAB-Map + gated Nav2.

ZED TF is disabled. qbotix_odom_relay owns odom->base_link; robot_state_publisher
owns base_link->robot/sensor links; RTAB-Map owns map->odom. Nav2 is gated until
both geometry and database have been explicitly confirmed by the operator.
"""
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, LogInfo
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution, PythonExpression
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    database_path = LaunchConfiguration('database_path')
    localization = LaunchConfiguration('localization')
    geometry_confirmed = LaunchConfiguration('geometry_confirmed')
    map_db_confirmed = LaunchConfiguration('map_db_confirmed')
    start_nav2 = LaunchConfiguration('start_nav2')
    start_rviz = LaunchConfiguration('start_rviz')
    nav2_params = PathJoinSubstitution([FindPackageShare('qbotix_autonomy'), 'config', 'nav2_params.yaml'])
    relay_params = PathJoinSubstitution([FindPackageShare('qbotix_odom_relay'), 'config', 'relay.yaml'])
    gate = PythonExpression([
        "'", geometry_confirmed, "' == 'true' and '", map_db_confirmed,
        "' == 'true' and '", start_nav2, "' == 'true'"
    ])

    return LaunchDescription([
        DeclareLaunchArgument('camera_model', default_value='zed2i'),
        DeclareLaunchArgument('database_path', default_value='/home/akshaya-b/maps/rtabmap.db',
                              description='Verified existing RTAB-Map database path.'),
        DeclareLaunchArgument('localization', default_value='true',
                              description='true uses an existing map; false runs mapping mode.'),
        DeclareLaunchArgument('geometry_confirmed', default_value='false',
                              description='Set true ONLY after physically measuring robot footprint and camera mount.'),
        DeclareLaunchArgument('map_db_confirmed', default_value='false',
                              description='Set true ONLY after verifying database_path is the intended existing map.'),
        DeclareLaunchArgument('start_nav2', default_value='true'),
        DeclareLaunchArgument('start_rviz', default_value='true'),

        LogInfo(msg='SAFETY GATE: Nav2 starts only when geometry_confirmed:=true and map_db_confirmed:=true.'),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(PathJoinSubstitution([
                FindPackageShare('zed_wrapper'), 'launch', 'zed_camera.launch.py'])),
            launch_arguments={
                'camera_model': LaunchConfiguration('camera_model'),
                'publish_tf': 'false',
                'publish_map_tf': 'false',
                'publish_urdf': 'true',
                'use_sim_time': 'false',
            }.items()),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(PathJoinSubstitution([
                FindPackageShare('bot_description'), 'launch', 'robot_description.launch.py'])),
            launch_arguments={'use_sim_time': 'false'}.items()),

        Node(package='qbotix_odom_relay', executable='camera_odom_relay',
             name='qbotix_camera_odom_relay', output='screen', parameters=[relay_params]),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(PathJoinSubstitution([
                FindPackageShare('zed_rtabmap_mapping'), 'launch', 'zed_mapping.launch.py'])),
            launch_arguments={
                'database_path': database_path,
                'localization': localization,
            }.items()),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(PathJoinSubstitution([
                FindPackageShare('nav2_bringup'), 'launch', 'navigation_launch.py'])),
            launch_arguments={'use_sim_time': 'false', 'params_file': nav2_params}.items(),
            condition=IfCondition(gate)),

        Node(package='rviz2', executable='rviz2', name='qbotix_rviz', output='screen',
             arguments=['-d', PathJoinSubstitution([
                 FindPackageShare('nav2_bringup'), 'rviz', 'nav2_default_view.rviz'])],
             condition=IfCondition(start_rviz)),
    ])
