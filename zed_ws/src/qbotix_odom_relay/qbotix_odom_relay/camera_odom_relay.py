"""Convert camera-origin odometry into base_link odometry and one TF edge.

ZED wrapper TF publishing must be disabled. This node owns odom -> base_link;
robot_state_publisher owns base_link -> zed_camera_link and the robot links.
"""
import math

import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster


def q_mul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
        aw * bw - ax * bx - ay * by - az * bz,
    )


def q_conj(q):
    return (-q[0], -q[1], -q[2], q[3])


def q_norm(q):
    n = math.sqrt(sum(v * v for v in q))
    if n < 1e-12:
        return (0.0, 0.0, 0.0, 1.0)
    return tuple(v / n for v in q)


def q_rotate(q, v):
    # Rotate a 3-vector by unit quaternion q.
    q = q_norm(q)
    vq = (v[0], v[1], v[2], 0.0)
    out = q_mul(q_mul(q, vq), q_conj(q))
    return (out[0], out[1], out[2])


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0])


def rpy_to_q(roll, pitch, yaw):
    cr, sr = math.cos(roll / 2), math.sin(roll / 2)
    cp, sp = math.cos(pitch / 2), math.sin(pitch / 2)
    cy, sy = math.cos(yaw / 2), math.sin(yaw / 2)
    return q_norm((sr * cp * cy - cr * sp * sy,
                   cr * sp * cy + sr * cp * sy,
                   cr * cp * sy - sr * sp * cy,
                   cr * cp * cy + sr * sp * sy))


class CameraOdomRelay(Node):
    def __init__(self):
        super().__init__('qbotix_camera_odom_relay')
        defaults = {
            'input_odom_topic': '/zed/zed_node/odom',
            'output_odom_topic': '/qbotix/odom',
            'odom_frame': 'odom',
            'camera_frame': 'zed_camera_link',
            'base_frame': 'base_link',
            'base_to_camera_x': 0.0,
            'base_to_camera_y': 0.0,
            'base_to_camera_z': 0.255,
            'base_to_camera_roll': 0.0,
            'base_to_camera_pitch': 0.0,
            'base_to_camera_yaw': 0.0,
            'publish_tf': True,
        }
        for name, value in defaults.items():
            self.declare_parameter(name, value)
        p = lambda name: self.get_parameter(name).value
        self.odom_frame = str(p('odom_frame'))
        self.camera_frame = str(p('camera_frame'))
        self.base_frame = str(p('base_frame'))
        self.t_base_camera = (float(p('base_to_camera_x')),
                              float(p('base_to_camera_y')),
                              float(p('base_to_camera_z')))
        self.q_base_camera = rpy_to_q(float(p('base_to_camera_roll')),
                                      float(p('base_to_camera_pitch')),
                                      float(p('base_to_camera_yaw')))
        self.do_tf = bool(p('publish_tf'))
        self.tf_broadcaster = TransformBroadcaster(self) if self.do_tf else None
        self.pub = self.create_publisher(Odometry, str(p('output_odom_topic')), 10)
        self.sub = self.create_subscription(Odometry, str(p('input_odom_topic')), self.cb, 20)
        self.warned_frame = False
        self.get_logger().info(
            f'Relaying {p("input_odom_topic")} camera pose to {p("output_odom_topic")} '
            f'with child {self.base_frame}; owns TF {self.odom_frame}->{self.base_frame} '
            f'= {self.do_tf}. Mount translation {self.t_base_camera} m.'
        )
        self.get_logger().warn('Camera mount values are provisional. Do not enable Nav2/motors until physically measured.')

    def cb(self, msg):
        if msg.header.frame_id and msg.header.frame_id.lstrip('/') != self.odom_frame:
            self.get_logger().error(f"Expected odom frame '{self.odom_frame}', got '{msg.header.frame_id}'. Dropping message.")
            return
        if msg.child_frame_id and msg.child_frame_id.lstrip('/') != self.camera_frame:
            if not self.warned_frame:
                self.get_logger().error(f"Expected camera child '{self.camera_frame}', got '{msg.child_frame_id}'. Check ZED frame settings.")
                self.warned_frame = True
            return

        pc = (msg.pose.pose.position.x, msg.pose.pose.position.y, msg.pose.pose.position.z)
        qc = q_norm((msg.pose.pose.orientation.x, msg.pose.pose.orientation.y,
                     msg.pose.pose.orientation.z, msg.pose.pose.orientation.w))
        q_base_camera_inv = q_conj(self.q_base_camera)
        q_odom_base = q_norm(q_mul(qc, q_base_camera_inv))
        rotated_mount = q_rotate(q_odom_base, self.t_base_camera)
        pb = (pc[0] - rotated_mount[0], pc[1] - rotated_mount[1], pc[2] - rotated_mount[2])

        out = Odometry()
        out.header = msg.header
        out.header.frame_id = self.odom_frame
        out.child_frame_id = self.base_frame
        out.pose.pose.position.x, out.pose.pose.position.y, out.pose.pose.position.z = pb
        (out.pose.pose.orientation.x, out.pose.pose.orientation.y,
         out.pose.pose.orientation.z, out.pose.pose.orientation.w) = q_odom_base
        # Rotate camera-frame twist into base-frame coordinates and shift linear
        # velocity from camera origin to base origin: v_base = v_camera - w x r.
        tw = msg.twist.twist
        v_cam = (tw.linear.x, tw.linear.y, tw.linear.z)
        w_cam = (tw.angular.x, tw.angular.y, tw.angular.z)
        v_base_rot = q_rotate(self.q_base_camera, v_cam)
        w_base = q_rotate(self.q_base_camera, w_cam)
        w_cross_r = cross(w_base, self.t_base_camera)
        v_base = tuple(v_base_rot[i] - w_cross_r[i] for i in range(3))
        out.twist.twist.linear.x, out.twist.twist.linear.y, out.twist.twist.linear.z = v_base
        out.twist.twist.angular.x, out.twist.twist.angular.y, out.twist.twist.angular.z = w_base
        # Covariances are copied as a conservative approximation. For precision
        # navigation, propagate them through the extrinsic Jacobian after mount
        # calibration; Nav2 primarily consumes the pose/twist and TF here.
        out.pose.covariance = list(msg.pose.covariance)
        out.twist.covariance = list(msg.twist.covariance)
        self.pub.publish(out)

        if self.tf_broadcaster:
            tf = TransformStamped()
            tf.header = out.header
            tf.child_frame_id = self.base_frame
            tf.transform.translation.x, tf.transform.translation.y, tf.transform.translation.z = pb
            (tf.transform.rotation.x, tf.transform.rotation.y,
             tf.transform.rotation.z, tf.transform.rotation.w) = q_odom_base
            self.tf_broadcaster.sendTransform(tf)


def main(args=None):
    rclpy.init(args=args)
    node = CameraOdomRelay()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
