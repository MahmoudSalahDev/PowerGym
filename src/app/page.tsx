"use client"
import { FormikHelpers, useFormik } from "formik";
import { set, get } from 'idb-keyval';
import { ChangeEvent, useEffect, useState } from "react";
import { boolean, object, string } from "yup";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Document, Page, Text, StyleSheet, pdf, Font, View } from '@react-pdf/renderer';



export type Member = {
  name: string,
  phone: string | number,
  price: string,
  notes: string,
  steam: string,
  date: string,
  expire: string,
  gym: boolean,
  cardio: boolean,
  card: boolean,
  group: boolean,
}

// Define initial values for the form
const initialValues: Member = {
  name: "",
  phone: "",
  price: "",
  notes: "",
  steam: "",
  date: "",
  expire: "",
  gym: true, // Initial state for the checkbox
  cardio: false, // Initial state for the checkbox
  card: true, // Initial state for the checkbox
  group: false, // Initial state for the checkbox
}





let archiveList: Member[] = [];


export default function Home() {
  const [memberList, setmemberList] = useState<Member[]>([])
  const [isUpdate, setisUpdate] = useState(false)
  const [isEditing, setIsEditing] = useState(false);
  const [inexUpadte, setinexUpadte] = useState(0)





  async function laodData() {
    const data = await get("members")
    if (data !== null) {
      setmemberList(data || [])
    }
    const archiveData = await get("archive")
    if (archiveData !== undefined) {
      // console.log(archiveData);

      archiveList = archiveData
      // console.log(archiveList);
    }
    // console.log(data);
  }

  function autoRemoveExpired() {
    const today = new Date()
    const clone = [...memberList]
    // console.log(clone);
    // console.log(archiveList);
    if (clone.length > 0) {
      for (let i = 0; i < clone.length; i++) {
        // console.log("test");
        const expireDlt = new Date(clone[i].expire)
        expireDlt.setDate(new Date(clone[i].expire).getDate() + 15)
        if (expireDlt < today) {
          console.log(`${clone[i].name} delete`);
          archiveList.unshift(clone[i])
          set("archive", archiveList); // Save to IndexedDB
          clone.splice(i, 1)
          setmemberList(clone)
          set("members", clone); // Save to IndexedDB
        }
      }
    }
  }

  /////////////////////to check the storage capacity/////////////////////

  // async function checkStorageUsage() {
  //   if (navigator.storage && navigator.storage.estimate) {
  //     const estimate = await navigator.storage.estimate();
  //     console.log("Used Storage:", estimate.usage, "bytes");
  //     console.log("Total Storage Available:", estimate.quota, "bytes");

  //     // Convert bytes to MB for easier reading
  //     console.log(`Used: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB`);
  //     console.log(`Total: ${(estimate.quota / 1024 / 1024).toFixed(2)} MB`);
  //   } else {
  //     console.log("Storage estimation is not supported in this browser.");
  //   }
  // }

  useEffect(() => {
    laodData()
    // checkStorageUsage(); // to check the storage
  }, [])
  useEffect(() => {
    // console.log(memberList); // Now this will show the correct updated state
    autoRemoveExpired()
  }, [memberList]);


  

  function detectMethod(values: Member, formikHelpers: FormikHelpers<Member>) {
    if (isUpdate) {
      updateMember(values, formikHelpers);
    } else {
      addMember(values, formikHelpers);
    }
  }

  function updateMember(values: Member, { resetForm }: FormikHelpers<Member>) {
    // console.log(values);
    const updatedList = [...memberList];

    updatedList[inexUpadte] = { ...updatedList[inexUpadte], ...values };

    setmemberList(updatedList);
    set("members", updatedList);
    resetForm();
    toast.success("member updated successfully")
  }


  function addMember(values: Member, { resetForm }: FormikHelpers<Member>) {
    // console.log(values);

    const member = { ...values };
    setmemberList(prevList => {
      const updatedList = [member, ...prevList]; // Create a new array
      set("members", updatedList); // Save to IndexedDB
      return updatedList;
    });
    // Reset the form fields after submission
    resetForm();
    toast.success("member added successfully")
  }

  const priceRegex = /^[0-9]{1,4}$/;
  const phoneRegex = /^01(0|1|2|5)[0-9]{8}$/;
  const validationSchema = object({
    name: string()
      .min(3, "Name must be at least 3 characters")
      .max(25, "Name must be at max 25 characters")
      .required("Name is required"),
    phone: string()
      .matches(phoneRegex, "Egyption phone number only")
      .required("Phone is required"),
    price: string()
      .matches(priceRegex, "price should be between 0 and 9999")
      .required("Price is required"),
    notes: string()
      .max(50, "Notes must be 50 characters or less"),
    steam: string()
      .matches(/^(100|[1-9]?[0-9])$/, "Max is 100"),
    date: string()
      .required("Subscription date is required"),
    expire: string()
      .test("expire-after-date", "Expiration must be after subscription", function (value) {
        const { date } = this.parent;
        return value ? new Date(value) > new Date(date) : false;
      })
      .required("Expiration date is required"),
    gym: boolean(),
    cardio: boolean(),
    card: boolean(),
    group: boolean(),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: detectMethod
  });

  // start search //////////////


  const [search, setsearch] = useState('')

  function searchFN(e: ChangeEvent<HTMLInputElement>) {
    setsearch(e.target.value.toLowerCase())
  }

  // end search //////////////


  // start adding days //////////////

  const [addDays, setaddDays] = useState<number | "">(""); // Allow empty string for clearing

  async function getUserInput() {
    const { value: userInput } = await Swal.fire({
      title: "confirm Password",
      input: "password",
      inputPlaceholder: "Type here...",
      showCancelButton: true,
      confirmButtonText: "Submit",
    });

    if (userInput == 12345) {
      const clone = [...memberList]
      for (let i = 0; i < clone.length; i++) {
        const expireDate = new Date(clone[i].expire); // Convert string to Date object
        expireDate.setDate(expireDate.getDate() + Number(addDays)); // Add 3 days
        clone[i].expire = expireDate.toISOString().split("T")[0] // Format it back to YYYY-MM-DD        
      }
      setmemberList(clone)
      set("members", clone); // Save to IndexedDB
      toast.success(`added ${addDays} days to everyone`)
      setaddDays("");
    } else {
      toast.error("password is incorrect!")
    }
  }

  // end adding days //////////////

  // start Export ////////////
  // Register the Arabic Font
  Font.register({
    family: 'Cairo',
    src: '/cairo.ttf', // Add your font file in the public/fonts folder
  });
  const exportToPDF = () => {
    const docDefinition = (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.header}>أعضاء الأرشيف</Text>

          {/* Table header */}
          <View style={styles.tableRow}>
            <Text style={styles.tableHeader}>جروب</Text>
            <Text style={styles.tableHeader}>كارت</Text>
            <Text style={styles.tableHeader}>الهاتف</Text>
            <Text style={styles.tableHeader}>ساونا</Text>
            <Text style={styles.tableHeader}>كارديو</Text>
            <Text style={styles.tableHeader}>جيم</Text>
            <Text style={styles.tableHeader}>الملاحظات</Text>
            <Text style={styles.tableHeader}>السعر</Text>
            <Text style={styles.tableHeader}>الانتهاء</Text>
            <Text style={styles.tableHeader}>الاشتراك</Text>
            <Text style={styles.tableHeader}>الاسم</Text>
          </View>

          {/* Table content */}
          {memberList.map((member, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCell}>{member.group == true ? "نعم" : ""}</Text>
              <Text style={styles.tableCell}>{member.card == true ? "نعم" : ""}</Text>
              <Text style={styles.tableCell}>{member.phone}</Text>
              <Text style={styles.tableCell}>{member.steam}</Text>
              <Text style={styles.tableCell}>{member.cardio == true ? "نعم" : ""}</Text>
              <Text style={styles.tableCell}>{member.gym == true ? "نعم" : ""}</Text>
              <Text style={styles.tableCell}>{member.notes}</Text>
              <Text style={styles.tableCell}>{member.price}</Text>
              <Text style={styles.tableCell}>{member.expire}</Text>
              <Text style={styles.tableCell}>{member.date}</Text>
              <Text style={styles.tableCell}>{member.name}</Text>
            </View>
          ))}
        </Page>
      </Document>
    );

    pdf(docDefinition).toBlob().then((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'المشتركين.pdf';
      link.click();
    });
  };
  const styles = StyleSheet.create({
    page: {
      padding: 20,
      fontSize: 8,
      fontFamily: 'Cairo', // Use the registered Arabic font
    },
    header: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
    },
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottom: 1,
      borderColor: '#ddd',
      padding: 5,
    },
    tableHeader: {
      fontWeight: 'bold',
      textAlign: 'center',
      width: '16%', // Each column width
    },
    tableCell: {
      textAlign: 'center',
      width: '16%', // Each column width
    },
  });

  // end export//////////////////
  return (
    <>
      <section className="">
        <div className="container">
          <form onSubmit={formik.handleSubmit} className="mt-4 p-3 backdrop-blur-sm rounded-md overflow-hidden border-[2px] border-solid border-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px]">
              <div className="relative z-0 w-full mb-5 group">
                <input type="text" name="name" id="name" value={formik.values.name} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="name" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Full Name</label>
                {formik.errors.name && formik.touched.name && <><span className="text-red-600">*{formik.errors.name}</span></>}
              </div>
              <div className="relative z-0 w-full mb-5 group">
                <input type="text" name="phone" id="phone" value={formik.values.phone} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="phone" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Phone Number</label>
                {formik.errors.phone && formik.touched.phone && <><span className="text-red-600">*{formik.errors.phone}</span></>}
              </div>
              <div className="relative z-0 w-full mb-5 group">
                <input type="number" min={0} name="price" id="price" value={formik.values.price} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="price" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Price</label>
                {formik.errors.price && formik.touched.price && <><span className="text-red-600">*{formik.errors.price}</span></>}
              </div>
              <div className="relative z-0 w-full mb-5 group">
                <input type="text" name="notes" id="notes" value={formik.values.notes} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="notes" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Notes</label>
                {formik.errors.notes && formik.touched.notes && <><span className="text-red-600">*{formik.errors.notes}</span></>}
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                <div className="relative z-0 w-full mb-5 group">
                  <input type="number" min={0} name="steam" id="steam" value={formik.values.steam} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                  <label htmlFor="steam" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Saona | Steam</label>
                  {formik.errors.steam && formik.touched.steam && <><span className="text-red-600">*{formik.errors.steam}</span></>}
                </div>
                <div className="relative z-0 w-full mb-5 group">
                  <label htmlFor="date" className="text-white">subscription</label>
                  <input type="date" name="date" id="date"
                    value={formik.values.date} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-[9px] px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder="date" />
                  {formik.errors.date && formik.touched.date && <><span className="text-red-600">*{formik.errors.date}</span></>}
                </div>
                <div>
                  <label htmlFor="expire" className="text-white">expiration</label>
                  <input type="date" name="expire" id="expire"
                    value={formik.values.expire} onBlur={formik.handleBlur} onChange={formik.handleChange} className="block py-[9px] px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none  focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder="expire" />
                  {formik.errors.expire && formik.touched.expire && <><span className="text-red-600">*{formik.errors.expire}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center mb-1">
              <input id="gym" type="checkbox" name="gym" checked={formik.values.gym} onChange={formik.handleChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600  focus:ring-2 " />
              <label htmlFor="gym" className="ms-2 text-sm font-medium text-white ">Gym</label>
            </div>
            <div className="flex items-center mb-1">
              <input id="cardio" type="checkbox" name="cardio" checked={formik.values.cardio} onChange={formik.handleChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600  focus:ring-2 " />
              <label htmlFor="cardio" className="ms-2 text-sm font-medium text-white ">Cardio</label>
            </div>
            <div className="flex items-center mb-1">
              <input id="card" type="checkbox" name="card" checked={formik.values.card} onChange={formik.handleChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600  focus:ring-2 " />
              <label htmlFor="card" className="ms-2 text-sm font-medium text-white ">Card</label>
            </div>
            <div className="flex items-center mb-1">
              <input id="group" type="checkbox" name="group" checked={formik.values.group} onChange={formik.handleChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600  focus:ring-2 " />
              <label htmlFor="group" className="ms-2 text-sm font-medium text-white ">Group</label>
            </div>
            {isEditing ? (
              <button
                type="submit"
                className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                onClick={() => {
                  setisUpdate(true)
                  setTimeout(() => {
                    setIsEditing(false)
                  }, 100);
                }}
              >
                Update
              </button>
            ) : (
              <button
                type="submit"
                className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                onClick={() => {
                  setisUpdate(false)
                }}
              >
                Add Member
              </button>
            )}
          </form>
        </div>
      </section>
      <section className="mt-5">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-2">
            <div className="order-3 md:order-1 relative z-0 w-full max-w-[300px] mb-5 group">
              <input type="text" name="search" id="search"
                onChange={(e) => { searchFN(e) }}
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white   focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
              <label htmlFor="search" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Search By Name or Phone</label>
            </div>
            <button type="button" onClick={exportToPDF} className="order-[2] text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Export</button>
            <div className="order-1 md:order-3 relative z-0 w-full max-w-[300px] mb-5 group">
              <input
                type="number"
                name="addDayes"
                id="addDayes"
                className="block py-2.5 px-4 pr-12 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                required
                min={0}
                value={addDays} // Controlled input
                onChange={(e) => setaddDays(Number(e.target.value) || "")}
              />
              <label
                htmlFor="addDayes"
                className="peer-focus:font-medium absolute text-sm text-white duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Add Days For All Members
              </label>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 translate-x-[-3px] bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                onClick={() => {
                  getUserInput()
                }}
              >
                Add
              </button>

            </div>
          </div>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 ">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
                <tr>
                  <th scope="col" className="px-2 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Expire
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Notes
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Gym
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Cardio
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Steam
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Phone
                  </th>
                  <th scope="col" className="px-2 py-3">
                    card
                  </th>
                  <th scope="col" className="px-2 py-3">
                    group
                  </th>
                  <th scope="col" className="px-2 py-3 flex justify-center">
                    options
                  </th>
                </tr>
              </thead>
              <tbody>
                {search == '' ? memberList?.map((member, index) => {
                  return <> {new Date(member?.expire) > new Date() ? (member.notes.includes("باقي") ? <>
                    <tr key={index} className="odd:bg-[#ffd000]  even:bg-[#e4ba00]  border-b  border-gray-200 text-black">
                      <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                        {member?.name}
                      </th>
                      <td className="px-2 py-4">
                        {member?.date}
                      </td>
                      <td className="px-2 py-4">
                        {member?.expire}
                      </td>
                      <td className="px-2 py-4">
                        {member?.price}
                      </td>
                      <td className="px-2 py-4">
                        {member?.notes}
                      </td>
                      <td className="px-2 py-4">
                        {member?.gym && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.cardio && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.steam}
                      </td>
                      <td className="px-2 py-4">
                        {member?.phone}
                      </td>
                      <td className="px-2 py-4">
                        {member?.card && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.group && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4 flex justify-center items-center gap-2">
                        <span><i onClick={() => {
                          setIsEditing(true);
                          formik.setValues(member)
                          setinexUpadte(index)
                        }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                        {isEditing == true ? "" : <><span ><i onClick={() => {
                          const updatedList = [...memberList];
                          console.log(member);
                          archiveList.unshift(member)
                          set("archive", archiveList); // Save to IndexedDB
                          updatedList.splice(index, 1);
                          setmemberList(updatedList) // Update the state
                          set("members", updatedList) // Save the updated list in storage
                          toast.success("member deleted successfully")
                        }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                      </td>
                    </tr>
                  </> : <tr key={index} className="odd:bg-green-500  even:bg-green-600  border-b  border-gray-200 text-black">
                    <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                      {member?.name}
                    </th>
                    <td className="px-2 py-4">
                      {member?.date}
                    </td>
                    <td className="px-2 py-4">
                      {member?.expire}
                    </td>
                    <td className="px-2 py-4">
                      {member?.price}
                    </td>
                    <td className="px-2 py-4">
                      {member?.notes}
                    </td>
                    <td className="px-2 py-4">
                      {member?.gym && <i className="fa-solid fa-check"></i>}
                    </td>
                    <td className="px-2 py-4">
                      {member?.cardio && <i className="fa-solid fa-check"></i>}
                    </td>
                    <td className="px-2 py-4">
                      {member?.steam}
                    </td>
                    <td className="px-2 py-4">
                      {member?.phone}
                    </td>
                    <td className="px-2 py-4">
                      {member?.card && <i className="fa-solid fa-check"></i>}
                    </td>
                    <td className="px-2 py-4">
                      {member?.group && <i className="fa-solid fa-check"></i>}
                    </td>
                    <td className="px-2 py-4 flex justify-center items-center gap-2">
                      <span><i onClick={() => {
                        setIsEditing(true);
                        formik.setValues(member)
                        setinexUpadte(index)
                      }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                      {isEditing == true ? "" : <><span ><i onClick={() => {
                        const updatedList = [...memberList];
                        // console.log(member);
                        // console.log(archiveList);
                        archiveList.unshift(member)
                        set("archive", archiveList); // Save to IndexedDB
                        updatedList.splice(index, 1);
                        setmemberList(updatedList) // Update the state
                        set("members", updatedList) // Save the updated list in storage
                        toast.success("member deleted successfully")
                      }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                    </td>
                  </tr>)
                    :
                    <tr key={index} className="odd:bg-[#eb7051]  even:bg-[#c05b42]  border-b  border-gray-200 text-black">
                      <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                        {member?.name}
                      </th>
                      <td className="px-2 py-4">
                        {member?.date}
                      </td>
                      <td className="px-2 py-4">
                        {member?.expire}
                      </td>
                      <td className="px-2 py-4">
                        {member?.price}
                      </td>
                      <td className="px-2 py-4">
                        {member?.notes}
                      </td>
                      <td className="px-2 py-4">
                        {member?.gym && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.cardio && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.steam}
                      </td>
                      <td className="px-2 py-4">
                        {member?.phone}
                      </td>
                      <td className="px-2 py-4">
                        {member?.card && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.group && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4 flex justify-center items-center gap-2">
                        <span><i onClick={() => {
                          setIsEditing(true);
                          formik.setValues(member)
                          setinexUpadte(index)
                        }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                        {isEditing == true ? "" : <><span ><i onClick={() => {
                          const updatedList = [...memberList];
                          archiveList.unshift(member)
                          set("archive", archiveList); // Save to IndexedDB
                          updatedList.splice(index, 1);
                          setmemberList(updatedList) // Update the state
                          set("members", updatedList) // Save the updated list in storage
                          toast.success("member deleted successfully")
                        }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                        {isEditing == true ? "" : <><span ><i onClick={() => {
                          formik.setFieldValue("name", member.name)
                          formik.setFieldValue("phone", member.phone)
                        }} className="fa-solid fa-rotate-right text-[20px] hover:text-[green] cursor-pointer hover:animate-spin"></i></span></>}
                      </td>
                    </tr>
                  }
                  </>
                }) : memberList?.map((member, index) => {
                  if (member.name.toLowerCase().includes(search) || member.phone.toString().includes(search))
                    return <> {new Date(member?.expire) > new Date() ? (member.notes.includes("باقي") ? <>
                      <tr key={index} className="odd:bg-[#ffd000]  even:bg-[#e4ba00]  border-b  border-gray-200 text-black">
                        <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                          {member?.name}
                        </th>
                        <td className="px-2 py-4">
                          {member?.date}
                        </td>
                        <td className="px-2 py-4">
                          {member?.expire}
                        </td>
                        <td className="px-2 py-4">
                          {member?.price}
                        </td>
                        <td className="px-2 py-4">
                          {member?.notes}
                        </td>
                        <td className="px-2 py-4">
                          {member?.gym && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.cardio && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.steam}
                        </td>
                        <td className="px-2 py-4">
                          {member?.phone}
                        </td>
                        <td className="px-2 py-4">
                          {member?.card && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.group && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4 flex justify-center items-center gap-2">
                          <span><i onClick={() => {
                            setIsEditing(true);
                            formik.setValues(member)
                            setinexUpadte(index)
                          }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                          {isEditing == true ? "" : <><span ><i onClick={() => {
                            const updatedList = [...memberList];
                            console.log(member);
                            archiveList.unshift(member)
                            set("archive", archiveList); // Save to IndexedDB
                            updatedList.splice(index, 1);
                            setmemberList(updatedList) // Update the state
                            set("members", updatedList) // Save the updated list in storage
                            toast.success("member deleted successfully")
                          }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                        </td>
                      </tr>
                    </> : <tr key={index} className="odd:bg-green-500  even:bg-green-600  border-b  border-gray-200 text-black">
                      <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                        {member?.name}
                      </th>
                      <td className="px-2 py-4">
                        {member?.date}
                      </td>
                      <td className="px-2 py-4">
                        {member?.expire}
                      </td>
                      <td className="px-2 py-4">
                        {member?.price}
                      </td>
                      <td className="px-2 py-4">
                        {member?.notes}
                      </td>
                      <td className="px-2 py-4">
                        {member?.gym && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.cardio && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.steam}
                      </td>
                      <td className="px-2 py-4">
                        {member?.phone}
                      </td>
                      <td className="px-2 py-4">
                        {member?.card && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4">
                        {member?.group && <i className="fa-solid fa-check"></i>}
                      </td>
                      <td className="px-2 py-4 flex justify-center items-center gap-2">
                        <span><i onClick={() => {
                          setIsEditing(true);
                          formik.setValues(member)
                          setinexUpadte(index)
                        }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                        {isEditing == true ? "" : <><span ><i onClick={() => {
                          const updatedList = [...memberList];
                          console.log(member);
                          archiveList.unshift(member)
                          set("archive", archiveList); // Save to IndexedDB
                          updatedList.splice(index, 1);
                          setmemberList(updatedList) // Update the state
                          set("members", updatedList) // Save the updated list in storage
                          toast.success("member deleted successfully")
                        }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                      </td>
                    </tr>)
                      :
                      <tr key={index} className="odd:bg-[#eb7051]  even:bg-[#c05b42]  border-b  border-gray-200 text-black">
                        <th scope="row" className="px-2 py-4 font-medium text-black whitespace-nowrap ">
                          {member?.name}
                        </th>
                        <td className="px-2 py-4">
                          {member?.date}
                        </td>
                        <td className="px-2 py-4">
                          {member?.expire}
                        </td>
                        <td className="px-2 py-4">
                          {member?.price}
                        </td>
                        <td className="px-2 py-4">
                          {member?.notes}
                        </td>
                        <td className="px-2 py-4">
                          {member?.gym && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.cardio && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.steam}
                        </td>
                        <td className="px-2 py-4">
                          {member?.phone}
                        </td>
                        <td className="px-2 py-4">
                          {member?.card && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4">
                          {member?.group && <i className="fa-solid fa-check"></i>}
                        </td>
                        <td className="px-2 py-4 flex justify-center items-center gap-2">
                          <span><i onClick={() => {
                            setIsEditing(true);
                            formik.setValues(member)
                            setinexUpadte(index)
                          }} className="fa-regular fa-pen-to-square text-[20px] hover:text-[yellow] cursor-pointer"></i></span>
                          {isEditing == true ? "" : <><span ><i onClick={() => {
                            const updatedList = [...memberList];
                            archiveList.unshift(member)
                            set("archive", archiveList); // Save to IndexedDB
                            updatedList.splice(index, 1);
                            setmemberList(updatedList) // Update the state
                            set("members", updatedList) // Save the updated list in storage
                            toast.success("member deleted successfully")
                          }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span></>}
                          {isEditing == true ? "" : <><span ><i onClick={() => {
                            formik.setFieldValue("name", member.name)
                            formik.setFieldValue("phone", member.phone)
                          }} className="fa-solid fa-rotate-right text-[20px] hover:text-[green] cursor-pointer hover:animate-spin"></i></span></>}
                        </td>
                      </tr>
                    }
                    </>
                  else {
                    return <><tr></tr></>
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
