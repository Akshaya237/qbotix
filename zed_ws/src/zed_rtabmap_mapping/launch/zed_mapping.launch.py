"""RTAB-Map localization (default) or mapping using ZED RGB-D and relayed base odometry."""
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, OpaqueFunction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare
from pathlib import Path


def _make_rtabmap(context, *args, **kwargs):
    database_path = LaunchConfiguration('database_path').perform(context)
    localization = LaunchConfiguration('localization').perform(context).lower() == 'true'
    if localization and not Path(database_path).is_file():
        raise RuntimeError(
            f"Localization mode requires an existing RTAB-Map database, but '{database_path}' does not exist. "
            "Pass database_path:=/absolute/path/to/the-verified-existing-map.db. "
            "Use localization:=false only for an intentional mapping session with a new path."
        )
    return [IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([
            FindPackageShare('rtabmap_launch'), 'launch', 'rtabmap.launch.py'])),
        launch_arguments={
            'frame_id': 'base_link',
            'rgb_topic': '/zed/zed_node/rgb/color/rect/image',
            'depth_topic': '/zed/zed_node/depth/depth_registered',
            'camera_info_topic': '/zed/zed_node/rgb/color/camera_info',
            'odom_topic': '/qbotix/odom',
            'visual_odometry': 'false',
            'approx_sync': 'true',
            'approx_rgbd_sync': 'true',
            'rgbd_sync': 'false',
            'localization': LaunchConfiguration('localization'),
            'rtabmap_viz': 'false',
            'rviz': 'false',
            'database_path': LaunchConfiguration('database_path'),
            'use_sim_time': 'false',
        }.items())
    ]


def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument(
            'database_path', default_value='/home/akshaya-b/maps/rtabmap.db',
            description='Path to the EXISTING RTAB-Map database; verify this path before launch.'),
        DeclareLaunchArgument('localization', default_value='true',
                              description='true reuses an existing database; false starts/continues mapping.'),
        OpaqueFunction(function=_make_rtabmap),
    ])
