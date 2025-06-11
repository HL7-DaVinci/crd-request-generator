import React, {Component} from 'react';
import { Paper, IconButton, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default class ConsoleBox extends Component {
    constructor(props){
        super(props);
        this.state = { 
            showStatus: "hideConsole",
            headerStatus: "collapseHeader"
            }

            this.toggleConsole = this.toggleConsole.bind(this);

        };


        
  handleAddition = (e, { value }) => {
    this.setState({
      options: [{ text: value, value }, ...this.state.options],
    })
  }

  handleChange = (e, { value }) => {
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  toggleConsole(){
      if(this.state.showStatus==="showConsole"){
        this.setState({showStatus:"hideConsole"});
        this.setState({headerStatus:"collapseHeader"});
      }else{
        this.setState({showStatus:"showConsole"});
        this.setState({headerStatus:"showHeader"});
      }
  }
  render() {

    try{
        var objDiv = document.getElementById("your_div");
        objDiv.scrollTop = objDiv.scrollHeight;
    }catch(e){

    }
      let i = 0;
      const isExpanded = this.state.showStatus === "showConsole";
    return (
        <Box sx={{ mt: 2 }}>
                <IconButton 
                    onClick={this.toggleConsole}
                    sx={{ 
                        backgroundColor: 'black', 
                        color: 'white',
                        border: 3,
                        borderColor: 'black',
                        borderRadius: 0,
                        width: isExpanded ? '100%' : 'auto',
                        '&:hover': { color: '#CCCCCC' }
                    }}
                >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            <Paper 
                id="your_div" 
                className = {this.state.showStatus + " consoleMain resize"}
                sx={{
                    backgroundColor: '#333333',
                    color: 'white',
                    fontFamily: 'Courier New, monospace',
                    p: 1,
                    overflow: 'auto',
                    maxHeight: isExpanded ? '200px' : '0px',
                    transition: 'max-height 0.2s ease',
                    wordBreak: 'break-all'
                }}
            >
                {this.props.logs.map(element => {
                    i++;
                    const colorMap = {
                        errorClass: '#dc3545',
                        warningClass: '#ffc107',
                        infoClass: '#17a2b8'
                    };
                    return <Typography key={i} variant="body2" sx={{ color: colorMap[element.type] || 'white' }}> 
                        &gt; {element.content}
                    </Typography>
                }) }
            </Paper>
        </Box>

    )
  }
}