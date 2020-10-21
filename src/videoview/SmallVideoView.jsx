import React from "react";

class SmallVideoView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      clientWidth:document.body.offsetWidth,
      clientHeight:document.body.offsetHeight,
    }
  }

  componentDidMount = () => {
    const { stream } = this.props;
    this.video.srcObject = stream;


  };

  componentWillUnmount = () => {
    this.video.srcObject = null;
  }

  _handleClick = () => {
    let { id, index } = this.props;
    this.props.onClick({ id, index });
  };

  _handleCommand = (uid) => {
    console.log("FROM SMALL VIDEO VIEW", uid);
  }

  render = () => {
    const { id, stream } = this.props;

    return (
      <div onClick={this._handleClick} className="small-video-div">
        <video
          ref={ref => {
            this.video = ref;
          }}
          id={id}
          autoPlay
          playsInline
          muted={false}
          className="small-video-size"
        />
        <div className="small-video-id-div">
          <a className="small-video-id-a">{stream.info.name}</a>
          <button onClick={() => {this._handleCommand(id)}}>Mute</button>
        </div>
      </div>
    );
  };
}

export default SmallVideoView;
