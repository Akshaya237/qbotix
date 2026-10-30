cmake_minimum_required(VERSION 3.8)

project(orbslam3_ros2)

if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(cv_bridge REQUIRED)
find_package(message_filters REQUIRED)
find_package(tf2 REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(OpenCV REQUIRED)
find_package(Eigen3 REQUIRED)
find_package(OpenGL REQUIRED)
find_package(GLEW REQUIRED)

include_directories(
  ${OpenCV_INCLUDE_DIRS}
  ${EIGEN3_INCLUDE_DIRS}
  /home/akshaya-b/ORB_SLAM3/include
  /home/akshaya-b/ORB_SLAM3/include/CameraModels
  /home/akshaya-b/ORB_SLAM3
  /home/akshaya-b/ORB_SLAM3/Thirdparty/Sophus
  /usr/local/include
)

add_executable(orbslam3_stereo_node
  src/orbslam3_stereo_node.cpp
)

ament_target_dependencies(orbslam3_stereo_node
  rclcpp
  sensor_msgs
  geometry_msgs
  nav_msgs
  cv_bridge
  message_filters
  tf2
  tf2_ros
)

target_link_libraries(orbslam3_stereo_node
  /home/akshaya-b/ORB_SLAM3/lib/libORB_SLAM3.so
  /usr/local/lib/libpangolin.so
  ${OpenCV_LIBRARIES}
  OpenGL::GL
  GLEW::GLEW
)

install(
  TARGETS orbslam3_stereo_node
  DESTINATION lib/${PROJECT_NAME}
)

install(
  DIRECTORY config
  DESTINATION share/${PROJECT_NAME}
)

ament_package()
