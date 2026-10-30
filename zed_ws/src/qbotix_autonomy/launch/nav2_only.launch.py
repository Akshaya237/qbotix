"""Safety-gated Nav2-only launch. Requires a live map/odom/base TF tree."""
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, LogInfo
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution, PythonExpression
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    geometry = LaunchConfiguration('geometry_confirmed')
    db = LaunchConfiguration('map_db_confirmed')
    enabled = LaunchConfiguration('start_nav2')
    gate = PythonExpression(["'", geometry, "' == 'true' and '", db,
                             "' == 'true' and '", enabled, "' == 'true'"])
    return LaunchDescription([
        DeclareLaunchArgument('geometry_confirmed', default_value='false'),
        DeclareLaunchArgument('map_db_confirmed', default_value='false'),
        DeclareLaunchArgument('start_nav2', default_value='true'),
        LogInfo(msg='Nav2-only safety gate requires geometry_confirmed:=true and map_db_confirmed:=true.'),
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(PathJoinSubstitution([
                FindPackageShare('nav2_bringup'), 'launch', 'navigation_launch.py'])),
            launch_arguments={
                'use_sim_time': 'false',
                'params_file': PathJoinSubstitution([
                    FindPackageShare('qbotix_autonomy'), 'config', 'nav2_params.yaml']),
            }.items(), condition=IfCondition(gate)),
    ])
