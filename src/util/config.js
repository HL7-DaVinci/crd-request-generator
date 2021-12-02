import config_default from '../properties.json';
import config_rems from '../properties-rems.json';


function determineConfigs() {
    console.log(process.env)
    if (process.env.REACT_APP_REMS_CONFIG) {
        return config_rems
    } else {
        return config_default
    }
}

export default determineConfigs();