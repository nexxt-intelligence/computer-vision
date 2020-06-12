import React from 'react';
import './App.css';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';
import ImageContainer from './components/ImageContainer';

// axios rate-limited to 1 request every 2 seconds
let http = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 2000 });

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            status: 'WAITING FOR USER UPLOAD',
            imgURL: '',
            imgType: '',
            imgData: '',
            boxes: []
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.imgURL !== this.state.imgURL) {
            console.log(this.state.imgURL);
            this.analyzeImage();
        }
    }
    async analyzeImage() {
        try {
            let apiOptions = {
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.REACT_APP_API_KEY,
                    'Content-Type':
                        this.state.imgType === 'URL'
                            ? 'application/json'
                            : 'application/octet-stream'
                }
            };

            // let's reset the boxes in case this is a new image
            this.setState({ boxes: [] });

            // first let's analyze any text in the image
            let cvAnalyzeTextResponse = await http.post(
                process.env.REACT_APP_CV_TEXT_API_ENDPOINT,
                this.state.imgType === 'URL'
                    ? { url: this.state.imgURL }
                    : this.state.imgData,
                apiOptions
            );
            let cvAnalyzeTextResults;
            this.setState({ status: 'ANALYZING TEXT' });
            // this is where the Azure CV API returns the URL which needs
            // to be requested to get the results.
            let resultsEndpoint =
                cvAnalyzeTextResponse.headers['operation-location'];

            // try to get results
            for (var i = 0; i < 10; i++) {
                // try 10 (rate-limited) times
                cvAnalyzeTextResults = await http.get(
                    resultsEndpoint,
                    apiOptions
                );
                // stop querying once initial request has been processed
                if (cvAnalyzeTextResults.data.status !== 'running') break;
            }
            this.setState({ status: 'TEXT ANALYZED' });
            console.log(
                'text boxes:',
                cvAnalyzeTextResults.data.analyzeResult.readResults
            );
            // console.log('results: ', cvAnalyzeTextResults);

            // now let's analyze any objects in the image
            this.setState({ status: 'ANALYZING OBJECTS' });
            let cvAnalyzeObjectsResponse = await http.post(
                process.env.REACT_APP_CV_OBJ_API_ENDPOINT,
                this.state.imgType === 'URL'
                    ? { url: this.state.imgURL }
                    : this.state.imgData,
                {
                    ...apiOptions,
                    params: {
                        visualFeatures: 'Objects'
                    }
                }
            );
            this.setState({ status: 'OBJECTS ANALYZED' });
            // console.log('cvAnalyzeObjectsResponse:', cvAnalyzeObjectsResponse);

            // now let's transform the two API response structures to look the same
            let boxes = [
                ...cvAnalyzeTextResults.data.analyzeResult.readResults[0].lines.map(
                    (line) => {
                        return {
                            text: line.text,
                            x: line.boundingBox[0],
                            y: line.boundingBox[1],
                            width: line.boundingBox[4] - line.boundingBox[0],
                            height: line.boundingBox[5] - line.boundingBox[1]
                        };
                    }
                ),
                ...cvAnalyzeObjectsResponse.data.objects.map((obj) => {
                    return {
                        text: obj.object,
                        x: obj.rectangle.x,
                        y: obj.rectangle.y,
                        width: obj.rectangle.w,
                        height: obj.rectangle.h
                    };
                })
            ];
            // console.log('boxes:', boxes);
            this.setState({ boxes, status: 'BOXES LOADED' });
        } catch (e) {
            this.setState({ status: 'ERROR: IMAGE ANALYSIS FAILED' });
        }
    }
    uploadImage = (evt) => {
        const imgData = evt.target.files[0];
        const imgURL = URL.createObjectURL(imgData);
        this.setState({ imgURL, imgData, imgType: 'BLOB' });
    };
    handleURLChange = (event) => {
        this.setState({ imgURL: event.target.value, imgType: 'URL' });
    };
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <p>{this.state.status}</p>
                    <input
                        type="file"
                        name="img"
                        accept="image/*"
                        onChange={(evt) => this.uploadImage(evt)}
                    />
                    <input
                        type="text"
                        value={this.state.imgURL}
                        onChange={this.handleURLChange}
                        placeholder="Enter any image URL"
                    />
                    {this.state.imgURL && (
                        <ImageContainer
                            imageURL={this.state.imgURL}
                            boxes={this.state.boxes}
                        />
                    )}
                </header>
            </div>
        );
    }
}

export default App;
