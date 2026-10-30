#include <memory>
#include <mutex>
#include <string>
#include <vector>

#include <rclcpp/rclcpp.hpp>

#include <sensor_msgs/msg/image.hpp>
#include <sensor_msgs/msg/point_cloud2.hpp>
#include <sensor_msgs/point_cloud2_iterator.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <nav_msgs/msg/path.hpp>
#include <tf2_ros/transform_broadcaster.h>
#include <geometry_msgs/msg/transform_stamped.hpp>

#include <cv_bridge/cv_bridge.hpp>
#include <message_filters/subscriber.h>
#include <message_filters/synchronizer.h>
#include <message_filters/sync_policies/approximate_time.h>

#include <opencv2/core/core.hpp>

#include <System.h>
#include <Atlas.h>
#include <MapPoint.h>

class ORBSLAM3StereoNode : public rclcpp::Node
{
public:

    ORBSLAM3StereoNode()
        : Node("orbslam3_stereo_node")
    {
        RCLCPP_INFO(this->get_logger(), "Starting ORB-SLAM3 Stereo Node...");

        // ------------------------------------------------------------
        // ORB-SLAM3 files
        // ------------------------------------------------------------

        vocab_path_ =
            "/home/akshaya-b/ORB_SLAM3/Vocabulary/ORBvoc.txt";

        settings_path =
            "/home/akshaya-b/zed_ws/src/orbslam3_ros2/config/ZED2i.yaml";

        RCLCPP_INFO(
            this->get_logger(),
            "Vocabulary: %s",
            vocab_path_.c_str());

        RCLCPP_INFO(
            this->get_logger(),
            "Settings: %s",
            settings_path.c_str());

        // ------------------------------------------------------------
        // Start ORB-SLAM3
        // Viewer disabled because RViz will be our viewer.
        // ------------------------------------------------------------

        slam_ = std::make_unique<ORB_SLAM3::System>(
            vocab_path_,
            settings_path,
            ORB_SLAM3::System::STEREO,
            false
        );

        RCLCPP_INFO(
            this->get_logger(),
            "ORB-SLAM3 initialized successfully."
        );

        // ------------------------------------------------------------
        // Publishers
        // ------------------------------------------------------------

        pose_pub_ =
            this->create_publisher<geometry_msgs::msg::PoseStamped>(
                "/orbslam3/camera_pose",
                10);

        path_pub_ =
            this->create_publisher<nav_msgs::msg::Path>(
                "/orbslam3/trajectory",
                10);

        map_pub_ =
            this->create_publisher<sensor_msgs::msg::PointCloud2>(
                "/orbslam3/map_points",
                1);

        // ------------------------------------------------------------
        // TF broadcaster
        // ------------------------------------------------------------

        tf_broadcaster_ =
            std::make_unique<tf2_ros::TransformBroadcaster>(*this);

        // ------------------------------------------------------------
        // ZED stereo image subscribers
        // ------------------------------------------------------------

        left_sub_.subscribe(
            this,
            "/zed/zed_node/left/color/rect/image");

        right_sub_.subscribe(
            this,
            "/zed/zed_node/right/color/rect/image");

        sync_ = std::make_shared<Synchronizer>(
            SyncPolicy(10),
            left_sub_,
            right_sub_);

        sync_->registerCallback(
            std::bind(
                &ORBSLAM3StereoNode::stereoCallback,
                this,
                std::placeholders::_1,
                std::placeholders::_2));

        RCLCPP_INFO(
            this->get_logger(),
            "Subscribed to ZED 2i stereo images."
        );

        RCLCPP_INFO(
            this->get_logger(),
            "Waiting for stereo frames..."
        );
    }

    ~ORBSLAM3StereoNode()
    {
        if (slam_)
        {
            RCLCPP_INFO(
                this->get_logger(),
                "Shutting down ORB-SLAM3..."
            );

            slam_->Shutdown();
        }
    }

private:

    // ------------------------------------------------------------
    // Message synchronization
    // ------------------------------------------------------------

    using SyncPolicy =
        message_filters::sync_policies::ApproximateTime<
            sensor_msgs::msg::Image,
            sensor_msgs::msg::Image>;

    using Synchronizer =
        message_filters::Synchronizer<SyncPolicy>;

    // ------------------------------------------------------------
    // Stereo callback
    // ------------------------------------------------------------

    void stereoCallback(
        const sensor_msgs::msg::Image::ConstSharedPtr &left_msg,
        const sensor_msgs::msg::Image::ConstSharedPtr &right_msg)
    {
        try
        {
            // --------------------------------------------------------
            // Convert ROS images to OpenCV
            // --------------------------------------------------------

            cv_bridge::CvImageConstPtr left_cv =
                cv_bridge::toCvShare(left_msg, "bgr8");

            cv_bridge::CvImageConstPtr right_cv =
                cv_bridge::toCvShare(right_msg, "bgr8");

            const cv::Mat &left_image =
                left_cv->image;

            const cv::Mat &right_image =
                right_cv->image;

            // --------------------------------------------------------
            // Timestamp
            // --------------------------------------------------------

            double timestamp =
                rclcpp::Time(left_msg->header.stamp).seconds();

            // --------------------------------------------------------
            // Run ORB-SLAM3
            // --------------------------------------------------------

            Sophus::SE3f Tcw =
                slam_->TrackStereo(
                    left_image,
                    right_image,
                    timestamp);

            // --------------------------------------------------------
            // Check tracking state
            // --------------------------------------------------------

            int state = slam_->GetTrackingState();

            if (state == ORB_SLAM3::Tracking::LOST)
            {
                RCLCPP_WARN_THROTTLE(
                    this->get_logger(),
                    *this->get_clock(),
                    3000,
                    "ORB-SLAM3 tracking lost."
                );

                return;
            }

            // --------------------------------------------------------
            // Camera pose
            //
            // ORB-SLAM3 gives Tcw:
            // world -> camera
            //
            // RViz needs camera pose in world:
            // Twc
            // --------------------------------------------------------

            Sophus::SE3f Twc = Tcw.inverse();

            Eigen::Vector3f translation =
                Twc.translation();

            Eigen::Quaternionf rotation =
                Twc.unit_quaternion();

            // --------------------------------------------------------
            // Publish PoseStamped
            // --------------------------------------------------------

            geometry_msgs::msg::PoseStamped pose;

            pose.header.stamp =
                left_msg->header.stamp;

            pose.header.frame_id =
                "map";

            pose.pose.position.x =
                translation.x();

            pose.pose.position.y =
                translation.y();

            pose.pose.position.z =
                translation.z();

            pose.pose.orientation.x =
                rotation.x();

            pose.pose.orientation.y =
                rotation.y();

            pose.pose.orientation.z =
                rotation.z();

            pose.pose.orientation.w =
                rotation.w();

            pose_pub_->publish(pose);

            // --------------------------------------------------------
            // Add pose to trajectory
            // --------------------------------------------------------

            path_.header.stamp =
                left_msg->header.stamp;

            path_.header.frame_id =
                "map";

            path_.poses.push_back(pose);

            path_pub_->publish(path_);

            // --------------------------------------------------------
            // Publish TF
            // map -> zed_left_camera_frame_optical
            // --------------------------------------------------------

            geometry_msgs::msg::TransformStamped tf_msg;

            tf_msg.header.stamp =
                left_msg->header.stamp;

            tf_msg.header.frame_id =
                "map";

            tf_msg.child_frame_id =
                "zed_left_camera_frame_optical";

            tf_msg.transform.translation.x =
                translation.x();

            tf_msg.transform.translation.y =
                translation.y();

            tf_msg.transform.translation.z =
                translation.z();

            tf_msg.transform.rotation.x =
                rotation.x();

            tf_msg.transform.rotation.y =
                rotation.y();

            tf_msg.transform.rotation.z =
                rotation.z();

            tf_msg.transform.rotation.w =
                rotation.w();

            tf_broadcaster_->sendTransform(tf_msg);

            // --------------------------------------------------------
            // Publish ORB-SLAM3 map
            // --------------------------------------------------------

            publishMap();

            RCLCPP_INFO_THROTTLE(
                this->get_logger(),
                *this->get_clock(),
                3000,
                "ORB-SLAM3 tracking active. Map points: %zu",
                last_map_point_count_
            );
        }
        catch (const std::exception &e)
        {
            RCLCPP_ERROR(
                this->get_logger(),
                "Stereo callback error: %s",
                e.what());
        }
    }

    // ----------------------------------------------------------
    // Publish ORB-SLAM3 map points
    // ------------------------------------------------------------

    void publishMap()
    {
        if (!slam_)
            return;

  

        std::vector<ORB_SLAM3::MapPoint*> map_points =
            slam_->GetAllMapPoints();

        sensor_msgs::msg::PointCloud2 cloud;

        cloud.header.stamp =
            this->get_clock()->now();

        cloud.header.frame_id =
            "map";

        cloud.height = 1;

        // Count valid points first
        size_t valid_points = 0;

        for (auto *mp : map_points)
        {
            if (!mp)
                continue;

            if (mp->isBad())
                continue;

            Eigen::Vector3f p =
                mp->GetWorldPos();

            if (!std::isfinite(p.x()) ||
                !std::isfinite(p.y()) ||
                !std::isfinite(p.z()))
                continue;

            valid_points++;
        }

        cloud.width =
            static_cast<uint32_t>(valid_points);

        cloud.is_bigendian = false;
        cloud.is_dense = false;

        sensor_msgs::PointCloud2Modifier modifier(cloud);

        modifier.setPointCloud2FieldsByString(
            1,
            "xyz");

        modifier.resize(valid_points);

        sensor_msgs::PointCloud2Iterator<float>
            iter_x(cloud, "x");

        sensor_msgs::PointCloud2Iterator<float>
            iter_y(cloud, "y");

        sensor_msgs::PointCloud2Iterator<float>
            iter_z(cloud, "z");

        for (auto *mp : map_points)
        {
            if (!mp)
                continue;

            if (mp->isBad())
                continue;

            Eigen::Vector3f p =
                mp->GetWorldPos();

            if (!std::isfinite(p.x()) ||
                !std::isfinite(p.y()) ||
                !std::isfinite(p.z()))
                continue;

            *iter_x = p.x();
            *iter_y = p.y();
            *iter_z = p.z();

            ++iter_x;
            ++iter_y;
            ++iter_z;
        }

        last_map_point_count_ =
            valid_points;

        map_pub_->publish(cloud);
    }

    // ------------------------------------------------------------
    // ORB-SLAM3
    // ------------------------------------------------------------

    std::unique_ptr<ORB_SLAM3::System> slam_;

    std::string vocab_path_;
    std::string settings_path;

    // ------------------------------------------------------------
    // ROS publishers
    // ------------------------------------------------------------

    rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr
        pose_pub_;

    rclcpp::Publisher<nav_msgs::msg::Path>::SharedPtr
        path_pub_;

    rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr
        map_pub_;

    std::unique_ptr<tf2_ros::TransformBroadcaster>
        tf_broadcaster_;

    // ------------------------------------------------------------
    // ZED subscribers
    // ------------------------------------------------------------

    message_filters::Subscriber<
        sensor_msgs::msg::Image> left_sub_;

    message_filters::Subscriber<
        sensor_msgs::msg::Image> right_sub_;

    std::shared_ptr<Synchronizer> sync_;

    // ------------------------------------------------------------
    // Trajectory
    // ------------------------------------------------------------

    nav_msgs::msg::Path path_;

    size_t last_map_point_count_ = 0;
};


int main(int argc, char **argv)
{
    rclcpp::init(argc, argv);

    auto node =
        std::make_shared<ORBSLAM3StereoNode>();

    rclcpp::spin(node);

    rclcpp::shutdown();

    return 0;
}
