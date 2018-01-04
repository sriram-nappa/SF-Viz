import React, { Component } from 'react';
import * as d3 from 'd3';

import {arteriesData, freewaysData, neighborhoodData, streetData} from '../utils/sfmaps/sf-map'
import './busMap.css';

let mapData = [arteriesData, freewaysData, neighborhoodData, streetData]
let mapName = ['arteries', 'freeways', 'neighborhoods', 'streets']

let mapProjection = null
let width = window.innerWidth * 0.8 - 30
let height = window.innerHeight - 30
let SFcity = {
    lon: 122.4417686,
    lat: 37.7682044
}

class BusMapSF extends Component {
    constructor(props) {
        super(props)
        
        this.state = {
            vehicle: null,
            path: {}
        }
    }


    componentDidMount() {
        let map = d3.select('.map-container').append('svg').attr('width',width).attr('height',height)
        mapProjection = d3.geoMercator().scale(200000).translate([width*3/8, height/2]).rotate([SFcity.lon, 0]).center([0,SFcity.lat])
        mapProjection.fitSize([width, height],neighborhoodData)
        const gPath = this.pathWithProjection(mapProjection)
        let dMap = []
        for(let i=0; i<mapName.length; i++) {
            dMap[i] = this.drawMap(mapName[i], mapData[i], map, gPath)
        }

        let vehicle = map.append('g')
        this.setState({
            path: gPath,
            vehicle: vehicle
        })
    }

    pathWithProjection(projection) {
        return d3.geoPath().projection(projection)
    }

    drawMap(className, mapData, map, gPath) {
        return map.append('g').selectAll('path')
            .data(mapData.features).enter()
            .append('path').attr('class', className)
            .attr('d', gPath)
    }

    render() {
        return (
        <div className="map-container">
        </div>
        );
    }
}

export default BusMapSF;
