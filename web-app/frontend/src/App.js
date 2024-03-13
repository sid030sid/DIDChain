import './App.css';
import React, { useState} from 'react';
import InputForTracing from './components/InputForTracing';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home"
import NoPage from "./components/NoPage"
import DrawerMenu from './components/subcomponents/DrawerMenu';
import Navbar from './components/subcomponents/Navbar';
import SCDMS from "./components/SCDMS"

function App() {

  // state variables
  const [openDrawerMenu, setOpenDrawerMenu] = useState(false)

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar handleDrawerMenu={()=>setOpenDrawerMenu(true)}></Navbar>
        <DrawerMenu 
          open={openDrawerMenu} 
          closeDrawerMenu={()=>setOpenDrawerMenu(false)} 
        />
        <Routes>
          <Route index element={<Home/>} />
          <Route path="/trace-and-track" element={<InputForTracing/>}/>
          <Route path="/scdms" element={<SCDMS/>}/>
          <Route path="*" element={<NoPage/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
