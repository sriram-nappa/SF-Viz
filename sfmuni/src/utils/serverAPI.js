const URL = "http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0"

export const getVehicleLocation = async () => {
    try {
        let response = await fetch(URL)
        let data = await response.json()
        console.log(data)
        return data
    } catch(e) {
        console.log(e)
    }
}