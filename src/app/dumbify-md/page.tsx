"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import "./page.css";

export default function DumbifyMdPage() {
  const [isMono, setIsMono] = useState(true);

  return (
    <div className="flex flex-col mx-auto gap-4 sm:gap-8 max-w-[640px]">
      <div className="sticky top-0 sm:top-4 z-50 bg-background/80 backdrop-blur-sm border-b-[0.5px] sm:border-[0.5px] drop-shadow-xs sm:rounded-xl px-4 py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-3 mr-auto">
            <div className="flex items-center gap-3">
              <Label className="text-sm whitespace-nowrap">Text style</Label>
              <ToggleGroup
                type="single"
                value={isMono ? "mono" : "default"}
                onValueChange={(value) => {
                  if (value) setIsMono(value === "mono");
                }}
                variant="outline"
              >
                <ToggleGroupItem value="default">Default</ToggleGroupItem>
                <ToggleGroupItem value="mono">Mono</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Button asChild>
            <a
              href="https://github.com/levinsondk/sandbox/blob/main/src/app/dumbify-md/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/github-mark-white.svg" alt="" className="size-4" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
      <div
        className={
          (isMono ? "notebookBlocks " : "") +
          "w-full mx-auto overflow-hidden px-4"
        }
      >
        <h1>Task: Delivery Delays</h1>
        <p>
          A food delivery company is trying to understand delays in order
          delivery. You've been asked to analyze the dataset and help uncover
          what might be contributing to the delays.
        </p>
        <p>
          <em>
            Use this file to document your reasoning and code. Dot is available
            in the chat to support you—feel free to talk through your ideas or
            ask questions as you go.
          </em>
        </p>
        <hr />
        <h2>Initial Exploration and Planning</h2>
        <p>
          <em>
            Use this section to do initial exploration and to outline your
            approach to the problem.
          </em>
        </p>
        <p>You might include:</p>
        <ul>
          <li>What you want to explore</li>
          <li>Questions or factors you think are relevant</li>
          <li>Any ideas you'd want to test and how you'd test them</li>
        </ul>
        <hr />
        <pre>
          <code>{`# Code goes here, feel free to add cells

import pandas as pd
import matplotlib.pyplot as plt`}</code>
        </pre>
        <hr />
        <pre>
          <code>{`df = pd.read_csv('FastDrop2.csv')`}</code>
        </pre>
        <hr />
        <pre>
          <code>{`df.info()`}</code>
        </pre>
        <pre>
          <code>{`<class 'pandas.core.frame.DataFrame'>
RangeIndex: 45584 entries, 0 to 45583
Data columns (total 20 columns):
 #   Column                       Non-Null Count  Dtype  
---  ------                       --------------  -----  
 0   ID                           45584 non-null  object 
 1   Delivery_person_ID           45584 non-null  object 
 2   Delivery_person_age          43730 non-null  float64
 3   Delivery_person_ratings      43676 non-null  float64
 4   Restaurant_latitude          45584 non-null  float64
 5   Restaurant_longitude         45584 non-null  float64
 6   Delivery_location_latitude   45584 non-null  float64
 7   Delivery_location_longitude  45584 non-null  float64
 8   Order_date                   45584 non-null  object 
 9   Time_ordered                 43853 non-null  object 
 10  Time_order_picked            45584 non-null  object 
 11  Weather_conditions           44968 non-null  object 
 12  Road_traffic_density         44983 non-null  object 
 13  Vehicle_condition            45584 non-null  int64  
 14  Type_of_order                45584 non-null  object 
 15  Type_of_vehicle              45584 non-null  object 
 16  Multiple_deliveries          44591 non-null  float64
 17  Festival                     45356 non-null  object 
 18  City                         44384 non-null  object 
 19  Time_taken (min)             45584 non-null  int64  
dtypes: float64(7), int64(2), object(11)
memory usage: 7.0+ MB`}</code>
        </pre>
        <hr />
        <pre>
          <code>{`df = df.drop(labels=['ID', 'Delivery_person_ID'], axis=1) #drop ID columns since they don't mean anything`}</code>
        </pre>
        <hr />
        <pre>
          <code>{`#see some quick data examples
df.head()`}</code>
        </pre>
        <p>
          <em>[HTML output]</em>
        </p>
      </div>
    </div>
  );
}
