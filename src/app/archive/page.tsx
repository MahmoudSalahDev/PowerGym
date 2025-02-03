"use client"
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Member } from '../page'
import { del, get, set } from 'idb-keyval'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { Document, Page, Text, StyleSheet, pdf, Font, View } from '@react-pdf/renderer';

// Register the Arabic Font
Font.register({
    family: 'Cairo',
    src: '/cairo.ttf', // Add your font file in the public/fonts folder
});


export default function Archive() {
    const [archiveList, setarchiveList] = useState<Member[]>([])

    async function laodData() {
        const data = await get("archive")
        if (data !== null) {
            setarchiveList(data)
        }
    }

    // function autoRemoveExpired() {
    //     const today = new Date()
    //     const clone = [...archiveList]
    //     // console.log(clone);
    //     // console.log(archiveList);
    //     if (clone.length > 20) {
    //         // for (let i = 0; i < clone.length; i++) {
    //         //     // console.log("test");
    //         //     const expireDlt = new Date(clone[i].expire)
    //         //     expireDlt.setDate(new Date(clone[i].expire).getDate() + 15)
    //         //     if (expireDlt < today) {
    //         //         console.log(`${clone[i].name} delete`);
    //         //         archiveList.unshift(clone[i])
    //         //         set("archive", archiveList); // Save to IndexedDB
    //         //         clone.splice(i, 1)
    //         //         setmemberList(clone)
    //         //         set("members", clone); // Save to IndexedDB
    //         //     }
    //         // }
    //         console.log("bigger");

    //     }
    // }

    function detectArchiveLimit() {
        if (archiveList.length > 300) {
            Swal.fire({
                title: "Archive list is over 300!",
                text: "Please Export and clear the Archive",
                icon: "error"
            });
        } 
    }


    useEffect(() => {
        laodData()
    }, [])
    useEffect(() => {
        // autoRemoveExpired()
        detectArchiveLimit()
    }, [archiveList]);

    const [search, setsearch] = useState('')
    function searchFN(e: ChangeEvent<HTMLInputElement>) {
        setsearch(e.target.value.toLowerCase())
    }

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
                    {archiveList.map((member, index) => (
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
            link.download = 'الارشيف.pdf';
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

    function handleDeleteArchive() {
        Swal.fire({
            title: "Are you sure you want to delete the Archive?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                setarchiveList([])
                del("archive")
                Swal.fire({
                    title: "Deleted!",
                    text: "Archive has been deleted.",
                    icon: "success"
                });
            } else {

            }
        });
        // setarchiveList([])
        // del("archive")
    }

    return (
        <>
            <section className="mt-5">
                <div className="container">
                    <div className='flex flex-col sm:flex-row justify-between items-center'>
                        <div className="order-2 sm:order-1 relative z-0 w-full max-w-[300px] mb-5 group">
                            <input type="text" name="search" id="search"
                                onChange={(e) => { searchFN(e) }}
                                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white   focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                            <label htmlFor="search" className="peer-focus:font-medium absolute text-sm text-white  duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Search By Name or Phone</label>
                        </div>
                        <div className='order-1 sm:sm:order-2'>
                            <button type="button" onClick={exportToPDF} className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Export</button>
                            <button type="button"
                                onClick={() => {
                                    handleDeleteArchive()
                                }}
                                className=" text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Clear the Archive</button>
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
                                    <th scope="col" className=" py-3 flex justify-center">
                                        options
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {search == '' ? archiveList?.map((member, index) => {
                                    return <tr key={index} className="odd:bg-[#eb7051]  even:bg-[#c05b42]  border-b  border-gray-200 text-black">
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
                                        <td className=" py-4 flex justify-center items-center gap-2">
                                            <span ><i onClick={() => {
                                                const updatedList = [...archiveList];
                                                updatedList.splice(index, 1);
                                                setarchiveList(updatedList) // Update the state
                                                set("archive", updatedList) // Save the updated list in storage
                                                toast.success("member deleted successfully")
                                            }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span>
                                        </td>
                                    </tr>
                                }) : archiveList?.map((member, index) => {
                                    if (member.name.toLowerCase().includes(search) || member.phone.toString().includes(search)) {
                                        return <tr key={index} className="odd:bg-[#eb7051]  even:bg-[#c05b42]  border-b  border-gray-200 text-black">
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
                                            <td className=" py-4 flex justify-center items-center gap-2">
                                                <span ><i onClick={() => {
                                                    const updatedList = [...archiveList];
                                                    updatedList.splice(index, 1);
                                                    setarchiveList(updatedList) // Update the state
                                                    set("archive", updatedList) // Save the updated list in storage
                                                    toast.success("member deleted successfully")
                                                }} className="fa-solid fa-trash-can text-[20px] hover:text-[red] cursor-pointer"></i></span>
                                            </td>
                                        </tr>
                                    } else {
                                        return <><tr></tr></>
                                    }
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>
    )
}
