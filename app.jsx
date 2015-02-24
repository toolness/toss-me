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
    if (this.props.isPublic)
      req.setRequestHeader('x-is-public', '1');
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
    if (data.type == 'uploads') {
      this.setState({
        files: data.uploads
      });
    } else if (data.type == 'reload') {
      setTimeout(function() {
        window.location.reload();
      }, 250);
    } else {
      console.log("unrecognized message: " + e.data);
    }
  },
  handleSubmit: function(e) {
    var fileInput = e.target.file;
    var newFiles = [];
    e.preventDefault();

    for (var i = 0; i < fileInput.files.length; i++)
      newFiles.push({
        file: fileInput.files[i],
        isPublic: e.target.ispublic.checked
      });

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
          <input type="checkbox" name="ispublic"/> Public
          <button type="submit">Upload</button>
        </form>
        {this.state.uploads.length
         ? <div>
             <h1>Uploads</h1>
             <ul>
             {this.state.uploads.map(function(info, i) {
               return <li key={i}>
                 <Upload file={info.file} isPublic={info.isPublic}/>
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
                 <code>
                 {info.isUploading
                  ? <span style={{color: 'gray'}}>{info.filename}</span>
                  : <a href={info.url} target="_blank">{info.filename}</a>}
                 </code>
               </li>;
             })}
             </ul>
           </div>
         : null}
      </div>
    );
  }
});
