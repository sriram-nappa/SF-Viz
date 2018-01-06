import React, {Component} from 'react';
import './routeSelector.css';

// REST API Routes URL
const routeURL = "http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni"

//Global option 
let allOptions = []

class RouteSelector extends Component {
    constructor(props) {
        super(props)
        this.state = {
            routes : {},
            selectedRoutes : ["all"]
        }
        this.optionSelect = this.optionSelect.bind(this)
        this.renderMap = this.renderMap.bind(this)
    }

    //Life cycle method
    componentDidMount() {
        this.getRoutes()
    }
    
    // Fetch routes 
    async getRoutes() {
        const response = await fetch(routeURL)
        const routeData = await response.json()
        let routeOptions = routeData.route
        let routes = []
        routeOptions.forEach((route) => {
            routes.push({
                routeId: route.tag,
                value: route.title
            })
        })
        allOptions = [...routes]
        this.setState({routes: routes})
    }

    // Generates route options for select DOM element
    renderOptions = (routes) => {
        return routes.map((route, i) => (
            <option key={i} value={route.routeId}>{route.value}</option>
        ))
    }

    // Calls Parent routeUpdate method to trigger map render
    renderMap() {
        const {selectedRoutes} = this.state
        if(selectedRoutes.indexOf("all")<0)
            this.props.routeUpdate(selectedRoutes)
        else
            this.props.routeUpdate([])
    }

    // Change listener to handle route selection
    optionSelect(ev) {
        let allOptions = [...ev.target.options]
        let selectedOptions = []
        selectedOptions = allOptions.filter((option) => {
            return (option.selected)
        }).map(option => {
            return option.value
        })
        let selectedRoutes = (selectedOptions.indexOf("all")<0) ? [...selectedOptions] : ["all"]
        this.setState({selectedRoutes : selectedRoutes})
    }

    render() {
        const {selectedRoutes} = this.state
        return (
            <div>
                <h3>Select Routes:</h3>
                <h5>(Press 'Ctrl'/'Cmd'/'Shift' key to select multiple routes)</h5>
                <select multiple className="route-selector" value={selectedRoutes} onChange={(ev) => this.optionSelect(ev)}>
                    <option value="all">All Routes</option>
                    {this.renderOptions(allOptions)}
                </select>
                <button className="route-btn" onClick={this.renderMap}>Render Selection</button>
            </div>
        )
    }
}

export default RouteSelector;