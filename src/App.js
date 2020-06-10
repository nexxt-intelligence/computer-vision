import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';

// axios rate-limited to 1 request every 2 seconds
let http = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 2000 })
let EXAMPLE_IMAGE_URL = 'https://www.canadalife.co.uk/media/3669/equity_release_print-3.jpg';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "WAITING FOR USER UPLOAD",
      imgBlob: EXAMPLE_IMAGE_URL,
      boxes: [],
    };
  }


  // TODO: instead of using example image on mount,
  // analysis should happen when user chooses a file from their
  // computer (or a URL)
  async componentDidMount() {
    this.analyzeImage(this.state.imgBlob);
  }

  async analyzeImage(imgBlob) {
    let apiOptions = {
      headers: { 
        'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY, 
        'Content-Type': 'application/json'
      },
    };  
    let cvAnalyzeResponse = await http.post(
      process.env.REACT_APP_API_ENDPOINT,
      {url: EXAMPLE_IMAGE_URL},
      apiOptions
    );
    this.setState({status: "UPLOADING"});
    if (cvAnalyzeResponse.status !== 202) {
      this.setState({status: "ERROR"});
    } else {
      // this is where the Azure CV API returns the URL which needs
      // to be requested to get the results.
      let resultsEndpoint = cvAnalyzeResponse.headers['operation-location'];

      // try to get results
      let cvAnalyzeResults;
      for (var i = 0; i < 10; i++) {  // try 10 (rate-limited) times
        cvAnalyzeResults = await http.get(
          resultsEndpoint,
          apiOptions
        );
        // stop querying once initial request has been processed
        if (cvAnalyzeResults.data.status !== 'running') break;
      }
      if (cvAnalyzeResults.data.status !== 'succeeded') {
        this.setState({status: "ERROR"});
      } else {
        this.setState({status: "PROCESSED"});
        console.log("boxes:", cvAnalyzeResults.data.analyzeResult.readResults);
      }
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>
            {this.state.status}
          </p>
          { this.state.imgBlob && (
            <img src={this.state.imgBlob} />
          )}
        </header>
      </div>
    );
  }
}

export default App;
