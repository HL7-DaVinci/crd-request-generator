import React, {Component} from 'react';
import { Paper, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PatientBox from './PatientBox';
import './smart.css';

export default class SMARTBox extends Component {
    constructor(props){
        super(props);
        this.state={
            minimized: false
        };

        this.minimizeSmart = this.minimizeSmart.bind(this);
    }

    minimizeSmart(){
        this.setState({"minimized":!this.state.minimized})
    }

    render() {        return (
            <Box sx={{ 
                position: 'fixed', 
                left: '3%', 
                top: '3%', 
                width: '94%', 
                height: '94%', 
                zIndex: 1000,
                backgroundColor: 'background.paper',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Paper sx={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 1, 
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2
                }}>                    <Box sx={{ 
                        backgroundColor: '#5f636a', 
                        color: 'white', 
                        p: 1, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        flexShrink: 0
                    }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            Patient Selection
                        </Typography>
                        <IconButton 
                            onClick={this.props.exitSmart}
                            sx={{ 
                                color: 'white', 
                                p: 0.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>                    <Box sx={{ 
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        p: { xs: 1.5, md: 2 }
                    }}>
                        {this.props.children}
                    </Box>
                </Paper>
            </Box>
        )
    }
}