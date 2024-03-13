import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button } from '@mui/material';

export default function CompartmentSelector(props) {

  // state variables
  const [compartment, setCompartment] = React.useState('');

  // function handling selections of user
  const handleChange = (event) => {
    setCompartment(event.target.value);
  };

  return (
    <Box >
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Materials</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={compartment}
          label="Materials"
          onChange={handleChange}
          
        >
            {props.compartments.map(compartment => (
                <MenuItem key={compartment.serviceEndpoint[0]} value={compartment.serviceEndpoint[0]}>{compartment.serviceEndpoint[0]}</MenuItem>
            ))}
        </Select>
      </FormControl>
      <Button 
        fullWidth
        sx={{marginTop:3}}
        variant="contained"
        onClick={()=>props.traceAndTrackCompartment(compartment)}
        >
            Trace material
        </Button>
    </Box>
  );
}