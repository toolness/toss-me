var React = require('react/addons');

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
      <p>Uploading <code>{this.props.file.name}</code> {
        this.state.status
        ? <span className={React.addons.classSet({
            "label": true,
            "label-success": this.state.status == 200,
            "label-danger": this.state.status != 200
          })}>{this.state.status}</span>
        : null
      }</p>

      <div className="progress">
        <div
         className="progress-bar"
         role="progressbar"
         aria-valuenow={this.state.progress}
         aria-valuemin="0"
         aria-valuemax="100"
         style={{width: this.state.progress + '%'}}>
          <span className="sr-only">{this.state.progress}% Complete</span>
        </div>
      </div>
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
    } else if (data.type == 'error') {
      console.error(data.message);
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
      <div className="container">
        <h1>Toss Me</h1>
        <p>{this.state.connected
            ? "Connected to server."
            : <span>
                Connecting to server&hellip; <img src="/throbber.svg"/>
              </span>}</p>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label className="sr-only">Files to upload</label>
            <input required type="file" name="file" multiple="multiple"/>
          </div>
          <div className="checkbox">
            <label>
              <input type="checkbox" name="ispublic"/> Files are public
            </label>
            <p className="help-block">Public files don't require a username or password to access.</p>
          </div>
          <button type="submit" className="btn btn-primary">Upload</button>
        </form>
        {this.state.uploads.length
         ? <div>
             <h2>Uploads</h2>
             <ul className="list-group">
             {this.state.uploads.map(function(info, i) {
               return <li className="list-group-item" key={i}>
                 <Upload file={info.file} isPublic={info.isPublic}/>
               </li>
             })}
             </ul>
           </div>
         : null}
        {this.state.files.length
         ? <div>
             <h2>Files</h2>
             <ul className="list-group file-list">
             {this.state.files.map(function(info) {
               return <li className={React.addons.classSet({
                 "list-group-item": true,
                 "disabled": info.isUploading
               })} key={info.url}>
                 <div className="row">
                   <div className="col-xs-11">
                     <code>
                       <a href={info.url} target="_blank">{info.filename}</a>
                     </code>
                    </div>
                    <div className="col-xs-1">
                      <a title="Download this file" href={info.url} download={info.filename}><span className="glyphicon glyphicon-save"/></a>
                    </div>
                 </div>
               </li>;
             })}
             </ul>
           </div>
         : null}
      </div>
    );
  }
});
