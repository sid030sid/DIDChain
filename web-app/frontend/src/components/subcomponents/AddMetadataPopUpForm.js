import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function AddMetadataPopUpForm(props) {

    // state variables
    const [open, setOpen] = React.useState(false);
    const [attribute, setAttribute] = React.useState("");
    const [value, setValue] = React.useState("");

    // functions to handle pop up opening
    const handleClickOpen = () => {
        setOpen(true);
    };

    // functions to handle pop up closing
    const handleClose = () => {
        setOpen(false);
    };

    // functions handling the addition of attributes and values for 
    // JSON file user desires to upload to IPFS
    const handleAdd = () => {
        if(attribute === "" | value === ""){
            alert("Please fill out the form!")
        }else{
            props.addEventInfo([attribute, value])
            handleClose()
            setAttribute("")
            setValue("")
        }
    }

    return (
        <React.Fragment>
            <IconButton size="large" onClick={handleClickOpen}>
                <AddCircleOutlineIcon/>
            </IconButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add event information</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Add an attribute and its value to uniquely descriibe your event.
                        Please make sure to follow the standard of your domain.
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        label="Attribute"
                        value={attribute}
                        onChange={(e)=>setAttribute(e.target.value)}
                        fullWidth
                        helperText="e. g. Quantity, Quantity metric, Quality, Quality metric etc."
                    />
                    <TextField
                        margin="dense"
                        label="Value"
                        value={value}
                        onChange={(e)=>setValue(e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
