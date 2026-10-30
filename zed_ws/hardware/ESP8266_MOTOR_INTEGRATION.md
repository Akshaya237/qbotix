# ESP8266 / motor integration — intentionally not auto-started

Known from the existing hardware notes: ESP8266 NodeMCU, `/dev/ttyUSB0`, Cytron MDD20A dual-channel driver, and a serial protocol using signed PWM values (`left,right`, range -255..255), plus a `stop` command and 500 ms watchdog.

This bundle deliberately does not auto-launch a motor bridge. A two-value left/right protocol does not by itself prove that the four motors are wired as left/right pairs or that lateral mecanum motion is supported. Before connecting Nav2 `/cmd_vel` to serial output:

1. Document exact motor-to-driver wiring and whether the base is differential, mecanum, or another configuration.
2. Implement/test the matching inverse kinematics and sign conventions at very low PWM with wheels lifted.
3. Confirm the ESP8266 watchdog stops all outputs after serial loss and on explicit stop.
4. Add an E-stop and ensure the driver defaults to stop on startup/reset.
5. Ensure only one process owns `/dev/ttyUSB0` and only one ROS node subscribes to `/cmd_vel` for physical output.
6. Test that zero Twist sends stop and that serial disconnect stops the robot.

Nav2's `/cmd_vel` output is not connected to motor hardware by this archive. That is intentional until the base controller and wheel geometry are verified.
