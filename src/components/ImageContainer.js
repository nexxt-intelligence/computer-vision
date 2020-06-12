import React from 'react';
import { Stage, Layer } from 'react-konva';
import { CanvasImage } from './CanvasImage';
import BoxArea from './BoxArea';

const initialRectangles = [
    {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        stroke: 'black',
        strokeWidth: 1,
        id: 'rect1'
    },
    {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        stroke: 'black',
        strokeWidth: 1,
        id: 'rect2'
    }
];

class ImageContainer extends React.Component {
    state = {
        component: this,
        rectangles: initialRectangles,
        selectedShapeName: null,
        selectedShape: null,
        enableTextEdit: false,
        width: null,
        height: null
    };
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.boxes !== prevState.rectangles) {
            return {
                ...prevState,
                rectangles: nextProps.boxes.length
                    ? prevState.component.dataParsing(nextProps.boxes)
                    : []
            };
        } else return null;
    }

    dataParsing = (boxes) => {
        const formattedBoxes = boxes.map((box, i) => {
            return {
                ...box,
                key: { i },
                id: `${i}`,
                stroke: '#ba102c',
                strokeWidth: 1
            };
        });
        return formattedBoxes;
    };

    getSize = (w, h) => {
        this.setState({
            ...this.state,
            width: w,
            height: h
        });
    };
    handleStageMouseDown = (e) => {
        // clicked on stage - cler selection
        if (e.target === e.target.getStage()) {
            this.setState({
                ...this.state,
                selectedShapeName: null,
                selectedShape: null
            });
            return;
        }
        // clicked on transformer - do nothing
        const clickedOnTransformer =
            e.target.getParent().className === 'Transformer';
        if (clickedOnTransformer) {
            return;
        }

        // find clicked rect by its name
        const name = e.target.name();
        const rect = this.state.rectangles.find(
            (r) => r.id === name.split('-')[0]
        );
        if (name) {
            this.setState({
                ...this.state,
                selectedShape: rect,
                selectedShapeName: name
            });
        } else {
            this.setState({
                ...this.state,
                selectedShape: null,
                selectedShapeName: null
            });
        }
    };
    handleText = (evt) => {
        const selected = this.state.selectedShape;
        selected.text = evt.target.value;
        const updateRect = this.state.rectangles;
        updateRect[selected.id] = selected;

        this.props.handleUpdateBoxes(updateRect);
    };
    onChangeEditStatus = () => (status) => {
        this.setState({
            enableTextEdit: status
        });
    };

    handleTextareaKeyDown = (e) => {
        // KEYCODE == ENTER || ESC
        if (e.keyCode === 13 || e.keyCode === 27) {
            this.setState({
                ...this.state,
                selectedShapeName: null,
                selectedShape: null
            });
        }
    };

    render() {
        const {
            width,
            height,
            rectangles,
            selectedShape,
            selectedShapeName,
            enableTextEdit
        } = this.state;
        const { imageURL } = this.props;
        return (
            <div className="image-container">
                <Stage
                    width={width}
                    height={height}
                    onMouseDown={this.handleStageMouseDown}
                    onTouchStart={this.handleStageMouseDown}
                    style={{
                        opacity: `${
                            selectedShape && enableTextEdit ? '.8' : '1'
                        }`
                    }}
                >
                    <Layer>
                        <CanvasImage src={imageURL} getSize={this.getSize} />
                        {rectangles.map((rect, i) => {
                            const hide =
                                selectedShapeName &&
                                (!selectedShape
                                    ? false
                                    : selectedShape.id !== rect.id);
                            return (
                                <BoxArea
                                    key={i}
                                    selectedShapeName={selectedShapeName}
                                    shapeProps={rect}
                                    isSelected={
                                        selectedShape &&
                                        rect.id === selectedShape.id
                                    }
                                    onSelect={() => {
                                        this.setState({
                                            ...this.state,
                                            selectedShape: rect,
                                            selectedShapeName: rect.name
                                        });
                                    }}
                                    onChange={(newAttrs) => {
                                        const rects = rectangles.slice();
                                        rects[i] = newAttrs;
                                        this.setState({
                                            rectangles: rects
                                        });
                                        this.props.handleUpdateBoxes(rects);
                                    }}
                                    changeEditStatus={this.onChangeEditStatus()}
                                    hide={hide}
                                />
                            );
                        })}
                    </Layer>
                </Stage>
                {selectedShape && enableTextEdit && (
                    <textarea
                        className="edit-area"
                        style={{
                            display: selectedShapeName ? 'block' : 'none',
                            position: 'absolute',
                            top: selectedShape.y + 'px',
                            left: selectedShape.x + 'px'
                        }}
                        r
                        value={selectedShape.text}
                        onChange={(e) => this.handleText(e)}
                        onKeyDown={(e) => this.handleTextareaKeyDown(e)}
                    />
                )}
            </div>
        );
    }
}

export default ImageContainer;
