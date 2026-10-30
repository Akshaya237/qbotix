from setuptools import setup

package_name = 'qbotix_odom_relay'
setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/config', ['config/relay.yaml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='QBotix project',
    maintainer_email='maintainer@example.com',
    description='ZED camera odometry to robot base odometry relay.',
    license='Apache-2.0',
    entry_points={'console_scripts': ['camera_odom_relay = qbotix_odom_relay.camera_odom_relay:main']},
)
