import React, { Component } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	View,
	Image,
	Button,
	TouchableOpacity,
	Dimensions,
	PermissionsAndroid
} from "react-native";
import {
	TwilioVideoLocalView,
	TwilioVideoParticipantView,
	TwilioVideo
} from "react-native-twilio-video-webrtc";

const { width, height } = Dimensions.get("window");

export default class Example extends Component {
	state = {
		isAudioEnabled: true,
		isVideoEnabled: true,
		status: "disconnected",
		videoTracks: [],
		roomName: "getter"
	};

	componentDidMount() {
		if (Platform.OS !== "android") {
			return;
		}

		PermissionsAndroid.requestMultiple([
			PermissionsAndroid.PERMISSIONS.CAMERA,
			PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
		]);
	}

	_onConnectButtonPress = () => {
		let token;
		fetch("http://192.168.1.117:3000/token")
			.then(response => response.json())
			.then(data => {
				console.log("Data:", data);
				this.refs.twilioVideo.connect({
					roomName: this.state.roomName,
					accessToken: data.token
				});
				this.setState({ status: "connecting" });
			})
			.catch(err => {
				console.err("Token Error:", err);
			});
	};

	_onEndButtonPress = () => {
		this.refs.twilioVideo.disconnect();
	};

	_onSwapPress = () => {
		let { videoTracks } = this.state;
		videoTracks = videoTracks.reverse(); 
		this.setState({videoTracks});
	};

	_onMuteButtonPress = () => {
		this.refs.twilioVideo
			.setLocalAudioEnabled(!this.state.isAudioEnabled)
			.then(isEnabled => this.setState({ isAudioEnabled: isEnabled }));
	};

	_onFlipButtonPress = () => {
		this.refs.twilioVideo.flipCamera();
	};

	_onRoomDidDisconnect = ({ roomName, error }) => {
		console.log("Room disconnected: ", roomName);

		this.setState({ status: "disconnected" });
	};

	_onRoomDidFailToConnect = error => {
		console.log("ERROR: ", error);

		this.setState({ status: "disconnected" });
	};

	_onParticipantAddedVideoTrack = ({ participant, track }) => {
		console.log("onParticipantAddedVideoTrack: ", participant, track);

		let videoTracks = [...this.state.videoTracks, {
			participantSid: participant.sid,
			videoTrackSid: track.trackSid
		}];
		console.log('_onParticipantAddedVideoTrack', videoTracks);

		this.setState({status: "connected", videoTracks});
	};

	_onParticipantRemovedVideoTrack = ({ participant, track }) => {
		console.log("onParticipantRemovedVideoTrack: ", participant, track);

		let videoTracks = this.state.videoTracks.filter(function(value, index, arr){
    		return value.videoTrackSid !== track.trackSid
		});
		console.log('_onParticipantRemovedVideoTrack', videoTracks);

		this.setState({videoTracks});
	};

	render() {
		
		let vt = this.state.videoTracks;

		return (
			<View style={styles.container}>
				{this.state.status === "disconnected" && (
					<View>
						<Text style={styles.welcome}>Group Video Chat</Text>
						<Text style={styles.roomName}>Room name</Text>
						<TextInput
							style={styles.input}
							autoCapitalize="none"
							value={this.state.roomName}
							onChangeText={text =>
								this.setState({ roomName: text })
							}
						></TextInput>
						<Button
							title="Connect"
							style={styles.button}
							onPress={this._onConnectButtonPress}
						></Button>
					</View>
				)}

				{(this.state.status === "connected" || this.state.status === "connecting") && (
					<View style={styles.callContainer}>

						{ vt.length >= 1 && <TwilioVideoParticipantView
							style={styles.mainVideo}
							key={vt[0].videoTrackSid}
							trackIdentifier={vt[0]}
						/>}

						{ vt.length === 2 && <TouchableOpacity
							style={[styles.videoSwap]}
							onPress={this._onSwapPress}>
								<TwilioVideoParticipantView
									style={[styles.videoView, styles.smallVideo]}
									key={vt[1].videoTrackSid}
									trackIdentifier={vt[1]}
								/>
						</TouchableOpacity>}

						<TwilioVideoLocalView
							enabled={true}
							style={[styles.videoView, styles.localVideo]}
						/>

						<View style={styles.optionsContainer}>
							<TouchableOpacity
								style={[styles.optionButton,{backgroundColor: "#ea4e3d"}]}
								onPress={this._onEndButtonPress}
							>
								<Image
									style={{width: 24, height: 24}}
									source={require('./src/images/close.png')}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={this._onMuteButtonPress}
							>
								<Image
									style={{width: 24, height: 24}}
									source={require('./src/images/mute.png')}
								/>
								<Text style={{ fontSize: 10, color: "white" }}>
									{this.state.isAudioEnabled
										? "Mute"
										: "Unmute"}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={this._onFlipButtonPress}
							>
								<Image
									style={{width: 34, height: 34}}
									source={require('./src/images/camera.png')}
								/>
							</TouchableOpacity>
						</View>
					</View>
				)}

				<TwilioVideo
					ref="twilioVideo"
					onRoomDidConnect={this._onRoomDidConnect}
					onRoomDidDisconnect={this._onRoomDidDisconnect}
					onRoomDidFailToConnect={this._onRoomDidFailToConnect}
					onParticipantAddedVideoTrack={this._onParticipantAddedVideoTrack}
					onParticipantRemovedVideoTrack={this._onParticipantRemovedVideoTrack}
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "white"
	},
	callContainer: {
		flex: 1,
		position: "absolute",
		bottom: 0,
		top: 0,
		left: 0,
		right: 0
	},
	welcome: {
		fontSize: 30,
		textAlign: "center",
		paddingTop: height*0.15
    },
    roomName: {
        fontSize: 16,
        textAlign: "center",
        paddingTop: 40
    },
	input: {
		height: 50,
		borderWidth: 1,
		marginRight: 70,
		marginLeft: 70,
		marginTop: 10,
		textAlign: "center",
        backgroundColor: "white",
        fontSize: 18
	},
	button: {
		marginTop: 100
	},
	videoSwap: {
		flex: 1,
		width: 110,
		height: 280,
		position: "absolute",
		left: 5,
		top: 5,
		// borderRadius: 5,
	},
	videoView: {
		flex: 1,
		width: 110,
		height: 180,
		position: "absolute",
		// backgroundColor: "gray",
		// borderRadius: 5,
		// borderColor: "pink",
		// borderWidth: 1,
	},
	localVideo: {
		right: 5,
		bottom: 5,
	},
	smallVideo: {
		left: 5,
		top: 5,
	},
	remoteGrid: {
		flex: 1,
		flexDirection: "row",
		flexWrap: "wrap"
	},
	mainVideo: {
		margin: 0,
		width: width,
		height: height,
	},
	optionsContainer: {
		position: "absolute",
		left: 0,
		bottom: 0,
		right: 0,
		height: 100,
		backgroundColor: "transparent",
		flexDirection: "row",
		alignItems: "center"
	},
	optionButton: {
		width: 60,
		height: 60,
		marginLeft: 10,
		marginRight: 10,
		borderRadius: 100 / 2,
		backgroundColor: 'rgba(52, 52, 52, 0.2)',
		justifyContent: "center",
		alignItems: "center"
	}
});
