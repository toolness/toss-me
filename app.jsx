var React = require('react');

var Upload = React.createClass({
  getInitialState: function() {
    return {
      status: null,
      progress: 0
    };
  },
  componentDidMount: function() {
    var req = new XMLHttpRequest();
    req.addEventListener('progress', this.handleProgress);
    req.addEventListener('load', this.handleLoad);
    req.addEventListener('error', this.handleError);
    req.open('POST', '/upload/' + this.props.file.name);
    req.send(this.props.file);
    this.req = req;
  },
  handleProgress: function(e) {
    if (e.lengthComputable) {
      this.setState({
        progress: Math.floor(e.loaded / e.total * 100)
      });
    }
  },
  handleLoad: function() {
    this.setState({
      status: this.req.status
    });
  },
  handleError: function() {
    this.setState({
      status: 'ERROR'
    });
  },
  render: function() {
    return <div>
      Uploading <code>{this.props.file.name}</code> <progress max="100" value={this.state.progress}>{this.state.progress}%</progress> {this.state.status}
    </div>;
  }
});

module.exports = React.createClass({
  getInitialState: function() {
    return {
      files: [],
      uploads: [],
      connected: false
    };
  },
  componentDidMount: function() {
    this.reconnect();
  },
  reconnect: function() {
    var socket = new WebSocket(this.props.socketURL);

    socket.addEventListener('open', this.handleOpen);
    socket.addEventListener('message', this.handleMessage);
    socket.addEventListener('close', this.handleClose);
  },
  handleOpen: function(e) {
    this.setState({
      connected: true
    });
  },
  handleClose: function(e) {
    this.setState({
      connected: false
    });
    window.setTimeout(this.reconnect, 3000);
  },
  handleMessage: function(e) {
    var data = JSON.parse(e.data);
    this.setState({
      files: data
    });
  },
  handleSubmit: function(e) {
    var fileInput = e.target.file;
    var newFiles = [];
    e.preventDefault();

    for (var i = 0; i < fileInput.files.length; i++)
      newFiles.push(fileInput.files[i]);

    this.setState({
      uploads: this.state.uploads.concat(newFiles)
    });
  },
  render: function() {
    return (
      <div>
        <p>{this.state.connected ? "Connected to server." :
                                   "Connecting to server..."}</p>
        <form onSubmit={this.handleSubmit}>
          <input required type="file" name="file" multiple="multiple"/>
          <button type="submit">Upload</button>
        </form>
        {this.state.uploads.length
         ? <div>
             <h1>Uploads</h1>
             <ul>
             {this.state.uploads.map(function(file, i) {
               return <li key={i}>
                 <Upload file={file}/>
               </li>
             })}
             </ul>
           </div>
         : null}
        {this.state.files.length
         ? <div>
             <h2>Files</h2>
             <ul>
             {this.state.files.map(function(info) {
               return <li key={info.url}>
                 <a href={info.url}
                    target="_blank"><code>{info.filename}</code></a>
               </li>;
             })}
             </ul>
           </div>
         : null}
      </div>
    );
  }
});
