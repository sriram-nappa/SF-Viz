import React, { Component } from 'react';
import * as d3 from 'd3';

import arteriesData from './utils/sfmaps/arteries'
import freewaysData from './utils/sfmaps/freeways'
import neighborhoodData from './utils/sfmaps/neighborhoods'
import streetData from './utils/sfmaps/streets'
import { geoMercator } from 'd3-geo';

class BusMapSF extends Component {
    constructor(props) {
        super(props)
        this.mapProjection = d3.geoMercator().translate([0,0]).precision(0)
        
        this.state = {
            vehiclePos: null
        }
    }

    componentDidMount() {
        let map = d3.select('.map-container').append('svg').attr('width',width).attr('height',height)
        this.mapProjection.fitSize([width,height, neighborhoodData])
        const gPath = d3.geoPath().projection(this.mapProjection)
    }

    render() {
        return (
        <div className="map-container">
            "hello"
        </div>
        );
    }
}

export default BusMapSF;
