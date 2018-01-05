import React, {Component} from 'react';

const routeURL = "http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni"

let allOptions = []
class RouteSelector extends Component {
    constructor(props) {
        super(props)
        this.state = {
            routes : {},
            selectedRoutes : {}
        }
        this.optionSelect = this.optionSelect.bind(this)
        this.renderMap = this.renderMap.bind(this)
    }

    // https://stackoverflow.com/questions/31709350/how-to-generate-random-color-for-jscharts
    getColorArray(num) {
        var result = [];
        for (var i = 0; i < num; i += 1) {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var j = 0; j < 6; j += 1) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            result.push(color);
        }
        return result;
    }

    // componentDidUpdate(prevProps, prevState) {
    //     if(prevState.routes !== this.state.routes) {
    //         this.props.routeUpdate(this.state.routes)
    //     }
    // }

    componentDidMount() {
        this.getRoutes()
    }
    
    async getRoutes() {
        const response = await fetch(routeURL)
        const routeData = await response.json()
        let routeOptions = routeData.route
        let routes = []
        routeOptions.map((route) => {
            routes.push({
                routeId: route.tag,
                value: route.title
            })
        })
        allOptions = [...routes]
        console.log(allOptions)
        this.setState({routes: routes})
    }

    renderOptions = (routes) => {
        return routes.map((route, i) => (
            <option key={i} value={route.routeId}>{route.value}</option>
        ))
    }

    renderMap() {
        const {selectedRoutes} = this.state
        this.props.routeUpdate(selectedRoutes)
    }

    optionSelect(ev) {
        let allOptions = [...ev.target.options]
        let selectedOptions = allOptions.filter((option) => {
           return (option.selected)
        }).map(option => {
            return option.value
        })
        this.setState({selectedRoutes : selectedOptions})
    }

    render() {
        const {routes} = this.state
        // let htmlVal = this.renderOptions(routes)
        console.log(routes)
        return (
            <div>
                <h3>Select Routes:</h3>   
                <select multiple onChange={(ev) => this.optionSelect(ev)}>
                    {/* <option value="Test">Test</option> */}
                    {this.renderOptions(allOptions)}
                </select>
                <button onClick={this.renderMap}>Render Selection</button>
            </div>
        )
    }
}

export default RouteSelector;