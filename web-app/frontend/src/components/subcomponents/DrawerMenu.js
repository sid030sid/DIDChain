import {Drawer, List, ListItem, ListItemButton, Button, Divider} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function DrawerMenu(props) {

    // object for changing path in browser for user
    const navigate = useNavigate();
    
    return (
        <Drawer
            className='App-text-bold'
            anchor="left"
            open={props.open}
            onClose={props.closeDrawerMenu}
        >
            <List>
                <ListItemButton onClick={()=>{props.closeDrawerMenu(); navigate("/")}}>
                    Home
                </ListItemButton>
                <ListItemButton onClick={()=>{props.closeDrawerMenu(); navigate("/trace-and-track")}}>
                    Trace and Track
                </ListItemButton>
                <ListItemButton onClick={()=>{props.closeDrawerMenu(); navigate("/scdms")}}>
                    Document events
                </ListItemButton>
            </List>
        </Drawer>
    );
}

export default DrawerMenu;