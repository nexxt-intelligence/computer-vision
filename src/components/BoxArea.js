import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import TransformerComponent from './TransformerComponent';
const BoxArea = ({
    shapeProps,
    isSelected,
    onSelect,
    onChange,
    selectedShapeName
}) => {
    return (
        <React.Fragment>
            <Group
                name={shapeProps.id}
                draggable
                x={shapeProps.x}
                y={shapeProps.y}
                width={shapeProps.width}
                height={shapeProps.height}
            >
                <Text
                    text={shapeProps.text}
                    fontSize={15}
                    name={`${shapeProps.id}-text`}
                    y={-15}
                />
                <Rect
                    name={`${shapeProps.id}-rect`}
                    stroke={'black'}
                    strokeWidth={1}
                    width={shapeProps.width}
                    height={shapeProps.height}
                />
            </Group>
            <TransformerComponent selectedShapeName={selectedShapeName} />
        </React.Fragment>
    );
};

export default BoxArea;
