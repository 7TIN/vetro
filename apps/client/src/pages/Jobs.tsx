import React, { useEffect, useState } from "react";

type Jobs = {
  title: string;
  application_url: string;
  name: string;
  id: number;
};
export const Jobs = () => {
  const [Jobs, setJobs] = useState<Jobs[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("inside function");
      const response = await fetch("http://localhost:5001/jobs");

      console.log("did data got stored");
      //   console.log(response)
      const data = await response.json();
      console.log(data.results);
      setJobs(data.results);
    };
    console.log("here");
    fetchData();
    console.log("here");
  }, []);

  return (
    <div className="w-full h-auto">
      {
        <div className="w-full h-full grid grid-cols-5 gap-2">
          {Jobs.map((job) => (
            <div
              className="flex flex-col gap-y-4 p-2 rounded-md border border-neutral-400 shadow-sm"
              key={job.id}
            >
              <p className="text-2xl">{job.title}</p>
              <p className="">{job.name}</p>
              <p className="">{job.application_url}</p>
              <button className="px-4 py-2 rounded-md border border-neutral-400" type="button" onClick={() => window.open(job.application_url, "_blank")}>redirect</button>
            </div>
          ))}
        </div>
      }
    </div>
  );
};
