import React, { Component } from 'react';
import * as d3 from 'd3';
import RouteSelector from './routeSelector'
import {arteriesData, freewaysData, neighborhoodData, streetData} from '../data/sfmaps/sf-map'

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

const vehicleDataURL = "http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0"
let lasttime = 0

class BusMapSF extends Component {
    constructor(props) {
        super(props)
        this.timer = null
        this.routeUpdate = this.routeUpdate.bind(this)
        this.state = {
            vehicle: null,
            path: {},
            routes: {},
            timer: null,
            time: 0
        }
    }

    componentDidMount() {
        let map = d3.select('.map-container').append('svg').attr('width',width).attr('height',height)
        mapProjection = d3.geoMercator().scale(200000).translate([width*3/8, height/2]).rotate([SFcity.lon, 0]).center([0,SFcity.lat])
        mapProjection.fitSize([width, height],neighborhoodData)
        // map.call(d3.zoom().on('zoom', function () {
        //     map.attr("transform", d3.event.transform)
        //  }))
        //  .append("g")
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
    componentDidUpdate(prevProps, prevState) {
        if(prevState.time !== this.state.time || prevState.vehicle !== this.state.vehicle || prevState.routes !== this.state.routes)
            this.drawVehiclePosition()
    }

    componentWillUnmount() {
        console.log('clear')
        clearInterval(this.timer)
    }

    setTimer(time) {
        console.log('In timer')
        clearInterval(this.timer)
        this.timer = setInterval(() => {
            this.setState({time: time})
        }, 15000)
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

    routeUpdate(selectedRoutes) {
        this.setState({
            routes: selectedRoutes
        })
    }
    
    async drawVehiclePosition() {
        const response = await fetch(vehicleDataURL)
        const vehicleData = await response.json()
        let vehiclePositions = vehicleData.vehicle
        let tooltipDiv = d3.select(".tooltip").append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
        console.log(vehiclePositions)
        if(vehicleData && vehicleData.lastTime) {
            lasttime = vehicleData.lastTime.time
            console.log(lasttime)
        }
        this.setTimer(lasttime)

        d3.selectAll('.sf-bus').remove();
        // var t = d3.transition()
        //     .duration(750)
        //     .ease(d3.easeLinear);
            
        let vehiclesPlot = this.state.vehicle
                    .selectAll('path')
                    .data(vehiclePositions)
                    .enter()
                    .append('svg:image')
                    .attr('xlink:href','http://www.iconninja.com/files/186/978/449/buss-shuttle-coach-bus-icon.svg')
                    .attr('x', function (d) { 
						return mapProjection([d.lon,d.lat])[0]; 
					})
                    .attr('y', function (d) { 
						return mapProjection([d.lon,d.lat])[1]; 
                    })
                    .attr('width',10)
                    .attr('height',10)
                    .attr('class','sf-bus')
                    .attr('id', function(d){ return d.id; })
					.attr('fill', function(d) {
                        var str = d.routeTag;
                        var hash = 0;
                        for (var i = 0; i < str.length; i++) {
                            hash = str.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        var colour = '#';
                        for (i = 0; i < 3; i++) {
                            var value = (hash >> (i * 8)) & 0xFF;
                            colour += ('66' + value.toString(16)).substr(-2);
                        }
                        return colour;
                    })
					.attr('fill-opacity', '0.9')
                    // .attr("cx", function (d) { 
					// 	return mapProjection([d.lon,d.lat])[0]; 
					// })
					// .attr("cy", function (d) { 
					// 	return mapProjection([d.lon,d.lat])[1]; 
					// })
                    //Tooltip for display bus information
                    .on("mouseover", function(d) {		
                        tooltipDiv.transition()		
                            .duration(200)		
                            .style("opacity", .9);		
                        tooltipDiv.html('Route - ' + d.routeTag + '<br/> Speed - ' + d.speedKmHr + 'km/hr')
                            .style("left", (d3.event.pageX) + "px")		
                            .style("top", (d3.event.pageY + 50) + "px");	
                        })
                    .on("mouseout", function(d) {		
                        tooltipDiv.transition()		
                            .duration(500)		
                            .style("opacity", 0);	
                    })
                    .attr('d', this.state.path);
                vehiclesPlot.exit().remove();
    }

    render() {
        const {routes} = this.state
        console.log('render')
        return (
            <div className="sfviz-wrapper">
                <div className="side-pane">    
                    <div className="zoom-ctrl">
                        <h3>Zoom Controls</h3>
                        <button id="zoom_in">+</button>
                        <button id="zoom_out">-</button>
                    </div>
                    <div className="route-select">
                        <RouteSelector allRoutes={routes} routeUpdate={this.routeUpdate}/>
                    </div>
                    <div className="tooltip-container">
                        <h3>Vehicle Details</h3>
                        <div className="tooltip">
                        </div>
                    </div>
                </div>
                <div className="map-container">
                </div>
            </div>
        )
    }
}

export default BusMapSF;
