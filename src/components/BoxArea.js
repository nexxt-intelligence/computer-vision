import React, { useEffect } from 'react';
import { Rect, Text, Group, Label, Tag } from 'react-konva';
import TransformerComponent from './TransformerComponent';
const BoxArea = ({
    shapeProps,
    isSelected,
    hide,
    onChange,
    changeEditStatus,
    selectedShapeName
}) => {
    const groupNode = React.useRef();
    const [text, setText] = React.useState(shapeProps.text);
    const [x, setXCordinate] = React.useState(shapeProps.x);
    const [y, setYCordinate] = React.useState(shapeProps.y);
    React.useEffect(() => {
        if (text !== shapeProps.text) {
            setText(shapeProps.text);
        }
        if (x !== shapeProps.x) {
            setXCordinate(shapeProps.x);
        }
        if (y !== shapeProps.y) {
            setYCordinate(shapeProps.y);
        }
    });

    const updateCordinates = () => {
        const currentNode = groupNode.current && groupNode.current.attrs;
        const newShape = {
            ...shapeProps,
            x: currentNode.x,
            y: currentNode.y,
            width: currentNode.width,
            height: currentNode.height
        };
        onChange(newShape);
    };
    return (
        <React.Fragment>
            {isSelected && selectedShapeName && (
                <Label x={x} y={y - 30} width={100}>
                    <Tag fill={'#ba102c'} />
                    <Text
                        text={text || 'Add label here'}
                        fontSize={20}
                        fill="white"
                        name={`${shapeProps.id}-text`}
                        wrap="word"
                        padding={5}
                        onMouseDown={(e) => changeEditStatus(true)}
                    />
                </Label>
            )}
            {!hide && (
                <Group
                    ref={groupNode}
                    name={shapeProps.id}
                    draggable
                    x={x}
                    y={y}
                    width={shapeProps.width}
                    height={shapeProps.height}
                    onTransformEnd={updateCordinates}
                    onDragEnd={updateCordinates}
                >
                    <Rect
                        name={`${shapeProps.id}-rect`}
                        stroke={shapeProps.stroke}
                        strokeWidth={shapeProps.strokeWidth}
                        width={shapeProps.width}
                        height={shapeProps.height}
                        onMouseDown={(e) => changeEditStatus(false)}
                    />
                </Group>
            )}
            <TransformerComponent selectedShapeName={selectedShapeName} />
        </React.Fragment>
    );
};

export default BoxArea;
