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

        // first let's analyze any text in the image
        let cvAnalyzeTextResponse = await http.post(
            process.env.REACT_APP_CV_TEXT_API_ENDPOINT,
            { url: imgBlob },
            apiOptions
        );
        let cvAnalyzeTextResults;
        this.setState({ status: 'ANALYZING TEXT' });
        if (cvAnalyzeTextResponse.status !== 202) {
            this.setState({ status: 'ERROR: TEXT ANALYTICS FAILED' });
            return;
        } else {
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
            if (cvAnalyzeTextResults.data.status !== 'succeeded') {
                this.setState({ status: 'ERROR: TEXT ANALYTICS FAILED' });
                return;
            } else {
                this.setState({
                    status: 'TEXT ANALYZED'
                });
                console.log(
                    'text boxes:',
                    cvAnalyzeTextResults.data.analyzeResult.readResults
                );
                // console.log('results: ', cvAnalyzeTextResults);
            }
        }

        // now let's analyze any objects in the image
        let cvAnalyzeObjectsResponse = await http.post(
            process.env.REACT_APP_CV_OBJ_API_ENDPOINT,
            { url: imgBlob },
            {
                ...apiOptions,
                params: {
                    visualFeatures: 'Objects'
                }
            }
        );
        this.setState({ status: 'ANALYZING OBJECTS' });
        if (cvAnalyzeObjectsResponse.status === 200) {
            // console.log('object boxes:', cvAnalyzeObjectsResponse.data.objects);
            this.setState({ status: 'OBJECTS ANALYZED' });
        } else {
            this.setState({ status: 'ERROR: OBJECT ANALYTICS FAILED' });
            return;
        }
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
    }
    uploadImage = (evt) => {
        const imageURL = URL.createObjectURL(evt.target.files[0]);
        this.setState({
            imgBlob: imageURL
        });
    };

    handleUpdateBoxes = (rect) => {
        this.setState({ boxes: rect });
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
                            handleUpdateBoxes={this.handleUpdateBoxes}
                        />
                    )}
                </header>
            </div>
        );
    }
}

export default App;
