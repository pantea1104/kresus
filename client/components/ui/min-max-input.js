import React, { useState, useEffect, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import { Range } from 'rc-slider';

import 'rc-slider/dist/rc-slider.css';
import './min-max-input.css';

const MinMaxInput = React.forwardRef((props, ref) => {
    let [lowText, setLowText] = useState(props.min);
    let [lowNumber, setLowNumber] = useState(props.min);
    let [highText, setHighText] = useState(props.max);
    let [highNumber, setHighNumber] = useState(props.max);

    let [prevMin, setPrevMin] = useState(props.min);
    let [prevMax, setPrevMax] = useState(props.max);

    // On every mount/update, if the previous value of props.{min, max} doesn't
    // match what we've had, then we've *probably* changed the view. It's
    // imprecise if two views have the same min/max values, but that's the best
    // we can do, and it's unlikely to happen.
    useEffect(() => {
        let changed = false;
        if (prevMin !== props.min) {
            setLowNumber(props.min);
            setLowText(props.min);
            setPrevMin(props.min);
            changed = true;
        }
        if (prevMax !== props.max) {
            setHighNumber(props.max);
            setHighText(props.max);
            setPrevMax(props.max);
            changed = true;
        }
        if (changed) {
            // Propagate the change up, by clearing the search. Ideally the
            // above form would just contain all the form search, but oh
            // well...
            props.onChange(null, null);
        }
    }, [props, prevMin, prevMax]);

    // Expose clear() through the reference.
    useImperativeHandle(ref, () => ({
        clear() {
            setLowText(props.min);
            setLowNumber(props.min);
            setHighText(props.max);
            setHighNumber(props.max);
        },
    }));

    // Aggregated helpers.
    let updateLow = newVal => {
        if (newVal !== lowNumber) {
            setLowNumber(newVal);
            setLowText(newVal);
            props.onChange(newVal, highNumber);
        }
    };
    let updateHigh = newVal => {
        if (newVal !== highNumber) {
            setHighNumber(newVal);
            setHighText(newVal);
            props.onChange(lowNumber, newVal);
        }
    };
    let validateLow = newLow => {
        // Don't allow a value larger than the highValue or smaller than the
        // props.min.
        updateLow(Math.min(highNumber, Math.max(newLow, props.min)));
    };
    let validateHigh = newHigh => {
        // Don't allow a value smaller than the lowValue or bigger than the
        // props.max.
        updateHigh(Math.max(lowNumber, Math.min(newHigh, props.max)));
    };

    // Event handlers.
    let handleLow = event => {
        let newVal = event.target.value;
        let newLow = Number.parseFloat(newVal);
        if (Number.isNaN(newLow)) {
            // Just update the text field; the user might be typing something.
            setLowText(newVal);
        } else {
            // Update in real-time, from a click on the arrows or a real-time
            // input.
            validateLow(newLow);
        }
    };

    let handleLowBlur = () => {
        let newLow = Number.parseFloat(lowText);
        if (Number.isNaN(newLow)) {
            // Reset to the previous value.
            setLowText(lowNumber);
        } else {
            validateLow(newLow);
        }
    };

    let handleHigh = event => {
        let newVal = event.target.value;
        let newHigh = Number.parseFloat(newVal);
        if (Number.isNaN(newHigh)) {
            // Just update the text field; the user might be typing something.
            setHighText(newVal);
        } else {
            // Update in real-time, from a click on the arrows or a real-time
            // input.
            validateHigh(newHigh);
        }
    };

    let handleHighBlur = () => {
        let newHigh = Number.parseFloat(highText);
        if (Number.isNaN(newHigh)) {
            // Reset to the previous value.
            setHighText(highNumber);
        } else {
            validateHigh(newHigh);
        }
    };

    let handleSlider = values => {
        // Only one slider value can be changed at a time.
        if (values[0] !== Infinity && values[0] !== lowNumber) {
            updateLow(values[0]);
        } else if (values[1] !== Infinity && values[1] !== highNumber) {
            updateHigh(values[1]);
        }
    };

    return (
        <div className="min-max-input">
            <input
                type="number"
                min={props.min}
                max={highNumber}
                data-type="low"
                value={lowText}
                onChange={handleLow}
                onBlur={handleLowBlur}
            />

            <Range
                allowCross={false}
                min={props.min}
                max={props.max}
                value={[lowNumber, highNumber]}
                onChange={handleSlider}
            />

            <input
                type="number"
                min={lowNumber}
                max={props.maxValue}
                data-type="high"
                value={highText}
                onChange={handleHigh}
                onBlur={handleHighBlur}
            />
        </div>
    );
});

MinMaxInput.propTypes = {
    // A function called when the input changes: onChange(lowValue, highValue).
    onChange: PropTypes.func,

    // The minimum value of the input.
    min: PropTypes.number.isRequired,

    // The maximum value of the input.
    max: PropTypes.number.isRequired,
};

export default MinMaxInput;
