import React, { Component } from 'react';
import * as d3 from 'd3';
import RouteSelector from './routeSelector'
import {arteriesData, freewaysData, neighborhoodData, streetData} from '../data/sfmaps/sf-map'

import './busMap.css';

// Combined JSON Map Data
const mapData = [arteriesData, freewaysData, neighborhoodData, streetData]
const mapName = ['arteries', 'freeways', 'neighborhoods', 'streets']

// Global Map Props
let mapProjection = null
const width = window.innerWidth * 0.8 - 30
const height = window.innerHeight - 30
const SFcity = {
    lon: 122.4417686,
    lat: 37.7682044
}

// REST API Vehicle Location URL
const vehicleDataURL = "http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0"

// Global props
let lasttime = 0
let pathHistory = {}

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
            time: 0,
            loader: false,
        }
    }

    // Life Cycle Methods
    componentDidMount() {
        let map = d3.select('.map-container').append('svg').attr('width',width).attr('height',height)
        mapProjection = d3.geoMercator().scale(1).translate([width*3/8, height/2]).rotate([SFcity.lon, 0]).center([0,SFcity.lat])
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

    componentDidUpdate(prevProps, prevState) {
        if(prevState.time !== this.state.time || prevState.vehicle !== this.state.vehicle || prevState.routes !== this.state.routes)
            this.drawVehiclePosition()
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }

    // 15 seconds refresh timer
    setTimer(time) {
        clearInterval(this.timer)
        this.timer = setInterval(() => {
            this.setState({time: time, loader: true})
        }, 15000)
    }

    //Geo Path Genrator
    pathWithProjection(projection) {
        return d3.geoPath().projection(projection)
    }

    // Paints JSON Map features
    drawMap(className, mapData, map, gPath) {
        return map.append('g').selectAll('path')
            .data(mapData.features).enter()
            .append('path').attr('class', className)
            .attr('d', gPath)
    }

    // Updates the selected routes
    routeUpdate(selectedRoutes) {
        this.setState({
            routes: selectedRoutes
        })
    }

    // Filter Vehicles based on selected routes
    filterVehicleData(response, selectedRoutes) {
        let filteredData = response.filter((vehicleObj) => {
            return (selectedRoutes.indexOf(vehicleObj.routeTag) !== -1)
        })
        return filteredData
    }
    
    // Logic to generate pair of recent path points for each vehicle.
    generatePathJSON(vehicleData) {
        let locationCache = pathHistory,
            filteredJSON = {}
        if(Object.keys(locationCache).length === 0){
            vehicleData.map((vehicleObj) => {
                let x = mapProjection([vehicleObj.lon,vehicleObj.lat])[0],
                    y = mapProjection([vehicleObj.lon,vehicleObj.lat])[1],
                    tempArr = []
                tempArr.push([x,y])
                locationCache[vehicleObj.id] = tempArr
                return null
            })
        } else {
            vehicleData.forEach((vehicleObj) => {
                let x = mapProjection([vehicleObj.lon,vehicleObj.lat])[0],
                    y = mapProjection([vehicleObj.lon,vehicleObj.lat])[1]
                if(locationCache[vehicleObj.id]) {
                    if(locationCache[vehicleObj.id].length > 1) {
                        locationCache[vehicleObj.id].shift()
                    }
                    locationCache[vehicleObj.id].push([x,y])
                } else {
                    let tempArr = []
                    tempArr.push([x,y])
                    locationCache[vehicleObj.id] = tempArr
                }
            })
        }
        if(Object.keys(locationCache).length !== vehicleData.length) {
            vehicleData.map((vehicle)=> {
                filteredJSON[vehicle.id] = locationCache[vehicle.id]
                return null
            })
            pathHistory = {...filteredJSON}
        } else {
            pathHistory = {...locationCache}
        }
        return pathHistory
    }

    // Renders vehicle paths based on last two recent positions
    drawVehiclePath(pathJSON) {
        let vehicleIds = Object.keys(pathJSON)
        let points = Object.values(pathJSON)
        let {vehicle} = this.state
        let pathTooltip = d3.select(".path-tooltip")
                    .append("div")
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
        let line = d3.line()
                    .x((d,i)=>{
                        return d[0]
                    })
                    .y((d,i)=>{
                        return d[1]
                    })
        points.forEach((point, i) => {
            if(point.length > 1)
                vehicle.append("path")
                    .attr("class", "vehicle-path")
                    .attr("d", line(point))
                    .style("cursor", "pointer")
                    .on("mouseover", function(d) {	
                        pathTooltip.transition()		
                            .duration(100)		
                            .style("opacity", .9)		
                        pathTooltip.html(`Vehicle ID - ${vehicleIds[i]}`)	
                        }
                    )
        })
    }

    // Render vehicle icons based on the location
    async drawVehiclePosition() {
        const {routes, vehicle} = this.state
        const response = await fetch(vehicleDataURL)
        const vehicleData = await response.json()
        let vehiclePositions = vehicleData.vehicle

        d3.selectAll('.tooltip').remove()

        let vehicleTooltip = d3.select(".vehicle-tooltip")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
        if(vehicleData && vehicleData.lastTime) {
            lasttime = vehicleData.lastTime.time
        }
        this.setTimer(lasttime)
        if(routes && routes.length) {
            vehiclePositions = this.filterVehicleData(vehiclePositions, routes)
        }
        let pathJSON = this.generatePathJSON(vehiclePositions)
        d3.selectAll('.vehicle-path').remove()
        d3.selectAll('.sf-bus').remove()

        let vehiclesPlot = vehicle
                    .selectAll('path')
                    .data(vehiclePositions)
                    .enter()
                    .append('svg:image')
                    .attr('class','sf-bus')
                    .attr('xlink:href','https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/MTS_Bus_icon.svg/500px-MTS_Bus_icon.svg.png')
                    .attr('x', (d) => {
						return mapProjection([d.lon,d.lat])[0]; 
					})
                    .attr('y', (d) => { 
						return mapProjection([d.lon,d.lat])[1]; 
                    })
                    .attr('width',10)
                    .attr('height',10)
                    .attr('id', (d) => {
                        return d.id 
                    })
                    .style("cursor", "pointer")
                    .on("mouseover", function(d) {	
                        vehicleTooltip.transition()		
                            .duration(100)		
                            .style("opacity", .9)		
                        vehicleTooltip.html(`Vehicle ID - ${d.id}<br/> Route - ${d.routeTag}<br/> Speed - ${d.speedKmHr} km/hr`)	
                        })
                    .attr('d', this.state.path);
                vehiclesPlot.exit().remove();
        this.drawVehiclePath(pathJSON)
        this.setState({loader: false})
    }

    render() {
        const {routes, loader} = this.state
        return (
            <div className="sfviz-wrapper">
                <div className="side-pane">  
                    <h1>San Francisco City</h1>
                    <h2>Bus Routes and Location</h2>
                    <p className="map-msg">Map automatically updates every 15 seconds</p>
                    <div className="route-select">
                        <RouteSelector allRoutes={routes} routeUpdate={this.routeUpdate}/>
                    </div>
                    <div className="tooltip-container">
                        <h3>Vehicle Details</h3>
                        <h5>(Hover over a vehicle)</h5>
                        <div className="vehicle-tooltip">
                        </div>
                        <h3>Path Details</h3>
                        <h5>(Hover over a path)</h5>
                        <div className="path-tooltip">
                        </div>
                    </div>
                </div>
                <div className="map-container">
                </div>
                {
                    (loader) ? 
                        <div className="overlay">
                            <div className="spinner">
                            </div>
                        </div> : null
                }
            </div>
        )
    }
}

export default BusMapSF;
