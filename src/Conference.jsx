import React from "react";
import { Spin, notification } from "antd";
import { LocalVideoView, MainVideoView, SmallVideoView, DrawArea } from "./videoview";
import { Client, LocalStream, RemoteStream } from 'brytecam-sdk-js';
import "../styles/css/conference.scss";

class Conference extends React.Component {
  constructor() {
    super();
    this.state = {
      streams: [],
      localStream: null,
      localScreen: null,
      audioMuted: false,
      videoMuted: false
    };
  }

  componentDidMount = () => {
    const { client } = this.props;
    client.on("stream-add", this._handleAddStream);
    client.on("stream-remove", this._handleRemoveStream);
  };

  componentWillUnmount = () => {
    const { client } = this.props;
    client.off("stream-add", this._handleAddStream);
    client.off("stream-remove", this._handleRemoveStream);
  };

  cleanUp = async () => {
    let { localStream, localScreen, streams } = this.state;
    await this.setState({ localStream: null, localScreen: null, streams: [] });

    streams.map(async item => {
      await item.stream.unsubscribe();
    });

    await this._unpublish(localStream)
  };

  _notification = (message, description) => {
    notification.info({
      message: message,
      description: description,
      placement: "bottomRight"
    });
  };

  _unpublish = async stream => {
    const { client } = this.props;
    if (stream) {
      await this._stopMediaStream(stream);
      await stream.unpublish();
    }
  };

  muteMediaTrack = (type, enabled) => {
    let { localStream } = this.state;
    if(!localStream) {
      return
    }
    if(enabled) {
      localStream.unmute(type)
    } else {
      localStream.mute(type)
    }

    if (type === "audio") {
      this.setState({ audioMuted: !enabled });
    } else if (type === "video") {
      this.setState({ videoMuted: !enabled });
    }
  };

  handleLocalStream = async (enabled) => {
    let { localStream } = this.state;
    const { client, settings } = this.props;
    console.log("Settings===========");
    console.log(settings);
   
    try {
      if (enabled) {
	//if (settings.selectedVideoDevice) {
	//	videoObj = { deviceId: settings.selectedVideoDevice }
	//} else {
	//	videoObj = true
	//}
        localStream = await LocalStream.getUserMedia({
          codec: settings.codec.toUpperCase(),
          resolution: settings.resolution,
          bandwidth: settings.bandwidth,
          audio: true,
          video:  { deviceId: settings.selectedVideoDevice },
	  //video: true,
        });
        await client.publish(localStream);
      } else {
        if (localStream) {
          this._unpublish(localStream);
          localStream = null;
        }
      }
      console.log("local stream", localStream.getTracks())
      this.setState({ localStream });
    } catch (e) {
      console.log("handleLocalStream error => " + e);
      // this._notification("publish/unpublish failed!", e);
    }

    //Check audio only conference
    this.muteMediaTrack("video", this.props.localVideoEnabled);

  };

  handleScreenSharing = async enabled => {
    let { localScreen } = this.state;
    const { client, settings } = this.props;
    if (enabled) {
      localScreen = await LocalStream.getDisplayMedia({
        codec: settings.codec.toUpperCase(),
        resolution: settings.resolution,
        bandwidth: settings.bandwidth,
      });
      await client.publish(localScreen);
      let track = localScreen.getVideoTracks()[0];
      if (track) {
        track.addEventListener("ended", () => {
          this.handleScreenSharing(false);
        });
      }
    } else {
      if (localScreen) {
        this._unpublish(localScreen);
        localScreen = null;
      }
    }
    this.setState({ localScreen });
  };

  _stopMediaStream = async (stream) => {
    let tracks = stream.getTracks();
    for (let i = 0, len = tracks.length; i < len; i++) {
      await tracks[i].stop();
    }
  };

  _handleAddStream = async (mid, info) => {
    const { client } = this.props;
    let streams = this.state.streams;
    let stream = await client.subscribe(mid);
    stream.info = info;
    console.log(mid, info, stream)
    streams.push({ mid: stream.mid, stream, sid: mid });
    this.setState({ streams });
  };

  _handleRemoveStream = async (stream) => {
    let streams = this.state.streams;
    streams = streams.filter(item => item.sid !== stream.mid);
    this.setState({ streams });
  };

  _onChangeVideoPosition = data => {
    let id = data.id;
    let index = data.index;
    console.log("_onChangeVideoPosition id:" + id + "  index:" + index);

    if (index == 0) {
      return;
    }

    const streams = this.state.streams;
    let first = 0;
    let big = 0;
    for (let i = 0; i < streams.length; i++) {
      let item = streams[i];
      if (item.mid == id) {
        big = i;
        break;
      }
    }

    let c = streams[first];
    streams[first] = streams[big];
    streams[big] = c;

    this.setState({ streams: streams });
  };

  render = () => {
    const { client, vidFit } = this.props;
    const {
      streams,
      localStream,
      localScreen,
      audioMuted,
      videoMuted
    } = this.state;
    const id = client.uid;
    return (
      <div className="conference-layout">
        <DrawArea/>
      </div>    
    );
  };
}

export default Conference;
