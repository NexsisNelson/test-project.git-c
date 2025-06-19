
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Add, FilterList } from "@mui/icons-material";
import { Tooltip, FormControl, Input, InputAdornment } from "@mui/material";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Path } from "../../utils";
import { searchSaleReducer } from "../../redux/reducer/sale";
import CreateSale from "./CreateSale";

const Topbar = ({ view, setView, open, setOpen, isFiltered, setIsFiltered }) => {
  ////////////////////////////////////////// VARIABLES //////////////////////////////////////
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const title = pathname.split("/")[1];
  const descriptionElementRef = useRef(null);

  ////////////////////////////////////////// STATES //////////////////////////////////////
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [scroll, setScroll] = useState("paper");

  ////////////////////////////////////////// USE EFFECTS //////////////////////////////////
  useEffect(() => {
    if (openCreateModal) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement != null) {
        descriptionElement.focus();
      }
    }
  }, [openCreateModal]);

  ////////////////////////////////////////// FUNCTIONS //////////////////////////////////////
  const handleSearch = (searchTerm) => {
    dispatch(searchSaleReducer(searchTerm));
  };

  const handleCreateopen = (scrollType) => () => {
    setOpenCreateModal(true);
    setScroll(scrollType);
  };

  const handleOpenFilter = () => {
    setOpen(true);
  };

  return (
    <div className="flex flex-col tracking-wide pb-8 font-primary">
      <div className="w-full text-[14px]">
        <Path />
      </div>

      <div className="md:flex justify-between items-center flex-none">
        <h1 className="text-primary-blue text-[32px] capitalize">{title}</h1>

        <div className="flex items-center justify-end gap-2 md:mt-0 mt-4">
          <div className="bg-[#ebf2f5] hover:bg-[#dfe6e8] p-1 pl-2 pr-2 rounded-md w-auto">
            <FormControl>
              <Input
                name="search"
                placeholder="Search Sales"
                onChange={(e) => handleSearch(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <PiMagnifyingGlass className="text-[25px]" />
                  </InputAdornment>
                }
              />
            </FormControl>
          </div>

          <div>
            <Tooltip title="Filter" placement="top" arrow>
              <div onClick={handleOpenFilter}>
                <button className="bg-primary-blue hover:bg-blue-400 transition-all text-white w-[44px] h-[44px] flex justify-center items-center rounded-full shadow-xl">
                  <FilterList />
                </button>
              </div>
            </Tooltip>
          </div>

          <div>
            <Tooltip title="Add New Sale" placement="top" arrow>
              <div onClick={handleCreateopen("body")}>
                <button className="bg-primary-red hover:bg-red-400 transition-all text-white w-[44px] h-[44px] flex justify-center items-center rounded-full shadow-xl">
                  <Add />
                </button>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      <CreateSale open={openCreateModal} setOpen={setOpenCreateModal} scroll={scroll} />
    </div>
  );
};

export default Topbar;
