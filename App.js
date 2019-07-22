import React, { Component } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	View,
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
		participants: new Map(),
		videoTracks: new Map(),
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
		fetch("http://192.168.1.113:3000/token")
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

		this.setState({
			status: "connected",
			videoTracks: new Map([
				...this.state.videoTracks,
				[
					track.trackSid,
					{
						participantSid: participant.sid,
						videoTrackSid: track.trackSid
					}
				]
			])
		});
	};

	_onParticipantRemovedVideoTrack = ({ participant, track }) => {
		console.log("onParticipantRemovedVideoTrack: ", participant, track);

		const videoTracks = this.state.videoTracks;
		videoTracks.delete(track.trackSid);

		this.setState({
			videoTracks: new Map([...videoTracks])
		});
	};

	render() {
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

				{(this.state.status === "connected" ||
					this.state.status === "connecting") && (
					<View style={styles.callContainer}>
						{this.state.status === "connected" && (
							<View>
								{Array.from(
									this.state.videoTracks,
									([trackSid, trackIdentifier]) => {
										return (
											<TwilioVideoParticipantView
												style={styles.remoteVideo}
												key={trackSid}
												trackIdentifier={
													trackIdentifier
												}
											/>
										);
									}
								)}
							</View>
						)}
						<View style={styles.optionsContainer}>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={this._onEndButtonPress}
							>
								<Text style={{ fontSize: 12 }}>End</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={this._onMuteButtonPress}
							>
								<Text style={{ fontSize: 12 }}>
									{this.state.isAudioEnabled
										? "Mute"
										: "Unmute"}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={this._onFlipButtonPress}
							>
								<Text style={{ fontSize: 12 }}>Flip</Text>
							</TouchableOpacity>
							<TwilioVideoLocalView
								enabled={true}
								style={styles.localVideo}
							/>
						</View>
					</View>
				)}

				<TwilioVideo
					ref="twilioVideo"
					onRoomDidConnect={this._onRoomDidConnect}
					onRoomDidDisconnect={this._onRoomDidDisconnect}
					onRoomDidFailToConnect={this._onRoomDidFailToConnect}
					onParticipantAddedVideoTrack={
						this._onParticipantAddedVideoTrack
					}
					onParticipantRemovedVideoTrack={
						this._onParticipantRemovedVideoTrack
					}
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
	localVideo: {
		flex: 1,
		width: width/3,
		height: height/3,
		position: "absolute",
		right: 0,
		bottom: 0
	},
	remoteGrid: {
		flex: 1,
		flexDirection: "row",
		flexWrap: "wrap"
	},
	remoteVideo: {
		marginTop: 20,
		marginLeft: 0,
		marginRight: 0,
		width: width,
		height: height
	},
	optionsContainer: {
		position: "absolute",
		left: 0,
		bottom: 0,
		right: 0,
		height: 100,
		backgroundColor: "blue",
		flexDirection: "row",
		alignItems: "center"
	},
	optionButton: {
		width: 60,
		height: 60,
		marginLeft: 10,
		marginRight: 10,
		borderRadius: 100 / 2,
		backgroundColor: "grey",
		justifyContent: "center",
		alignItems: "center"
	}
});
