import React from 'react';
import { Stage, Layer } from 'react-konva';
import { CanvasImage } from './CanvasImage';
import BoxArea from './BoxArea';

const ImageContainer = (props) => {
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

    const [rectangles, setRectangles] = React.useState(initialRectangles);
    const [selectedShapeName, selectShapeName] = React.useState(null);
    const [width, setWidth] = React.useState(null);
    const [height, setHeight] = React.useState(null);
    const imageRef = React.useRef(null);
    React.useEffect(() => {
        setRectangles(props.boxes.length ? dataParsing(props.boxes) : []);
    }, [props]);

    const dataParsing = (boxes) => {
        const formattedBoxes = boxes.map((box, i) => {
            return {
                ...box,
                key: { i },
                id: `${i}`,
                stroke: 'black',
                strokeWidth: 1
            };
        });
        return formattedBoxes;
    };

    const getSize = (w, h) => {
        setWidth(w);
        setHeight(h);
    };
    const handleStageMouseDown = (e) => {
        // clicked on stage - cler selection
        if (e.target === e.target.getStage()) {
            selectShapeName(null);
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
        // const rect = this.state.rectangles.find(r => r.name === name);
        if (name) {
            selectShapeName(name);
        } else {
            selectShapeName('');
        }
    };
    return (
        <Stage
            width={width}
            height={height}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
        >
            <Layer>
                <CanvasImage
                    src={props.imageURL}
                    ref={imageRef}
                    getSize={getSize}
                />
                {rectangles.map((rect, i) => {
                    return (
                        <BoxArea
                            key={i}
                            selectedShapeName={selectedShapeName}
                            shapeProps={rect}
                            isSelected={rect.id === selectedShapeName}
                            onSelect={() => {
                                selectShapeName(rect.id);
                            }}
                            onChange={(newAttrs) => {
                                const rects = rectangles.slice();
                                rects[i] = newAttrs;
                                setRectangles(rects);
                            }}
                        />
                    );
                })}
            </Layer>
        </Stage>
    );
};

export default ImageContainer;
