var React = require('react');

var Upload = React.createClass({
  getInitialState: function() {
    return {
      status: null
    };
  },
  componentDidMount: function() {
    var req = new XMLHttpRequest();
    req.open('POST', '/upload/' + this.props.file.name);
    req.onload = this.handleLoad;
    req.send(this.props.file);
    this.req = req;
  },
  handleLoad: function() {
    this.setState({
      status: this.req.status
    });
  },
  render: function() {
    return <div>Uploading <code>{this.props.file.name}</code> {this.state.status}</div>;
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
          <input type="file" name="file" multiple="multiple"/>
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
