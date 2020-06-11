import React from 'react';
import './App.css';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import ImageContainer from './components/ImageContainer';

// axios rate-limited to 1 request every 2 seconds
let http = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 2000 });
let EXAMPLE_IMAGE_URL =
    'https://www.canadalife.co.uk/media/3669/equity_release_print-3.jpg';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 'WAITING FOR USER UPLOAD',
            imgBlob: EXAMPLE_IMAGE_URL,
            boxes: []
        };
    }

    // TODO: instead of using example image on mount,
    // analysis should happen when user chooses a file from their
    // computer (or a URL)
    async componentDidMount() {
        this.analyzeImage(this.state.imgBlob);
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.imgBlob !== this.state.imgBlob) {
            console.log(this.state.imgBlob);
            this.analyzeImage(this.state.imgBlob);
        }
    }
    async analyzeImage(imgBlob) {
        let apiOptions = {
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
                'Content-Type': 'application/json'
            }
        };
        let cvAnalyzeResponse = await http.post(
            process.env.REACT_APP_API_ENDPOINT,
            { url: imgBlob },
            apiOptions
        );
        this.setState({ status: 'UPLOADING' });
        if (cvAnalyzeResponse.status !== 202) {
            this.setState({ status: 'ERROR' });
        } else {
            // this is where the Azure CV API returns the URL which needs
            // to be requested to get the results.
            let resultsEndpoint =
                cvAnalyzeResponse.headers['operation-location'];

            // try to get results
            let cvAnalyzeResults;
            for (var i = 0; i < 10; i++) {
                // try 10 (rate-limited) times
                cvAnalyzeResults = await http.get(resultsEndpoint, apiOptions);
                // stop querying once initial request has been processed
                if (cvAnalyzeResults.data.status !== 'running') break;
            }
            if (cvAnalyzeResults.data.status !== 'succeeded') {
                this.setState({ status: 'ERROR' });
            } else {
                this.setState({
                    status: 'PROCESSED',
                    boxes: cvAnalyzeResults.data.analyzeResult.readResults
                });
                console.log(
                    'boxes:',
                    cvAnalyzeResults.data.analyzeResult.readResults
                );
                console.log('results: ', cvAnalyzeResults);
            }
        }
    }
    uploadImage = (evt) => {
        const imageURL = URL.createObjectURL(evt.target.files[0]);
        this.setState({
            imgBlob: imageURL
        });
    };
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <p>{this.state.status}</p>
                    {/* 
                      @Disabled for now. Blob issue on API request using uploaded image.
                      <input
                        type="file"
                        name="img"
                        accept="image/*"
                        onChange={(evt) => this.uploadImage(evt)}
                    /> */}
                    {this.state.imgBlob && (
                        <ImageContainer
                            imageURL={this.state.imgBlob}
                            boxes={this.state.boxes}
                        />
                    )}
                </header>
            </div>
        );
    }
}

export default App;
